package com.quizplatform.auth;

import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.BannedUserException;
import com.quizplatform.common.ConflictException;
import com.quizplatform.common.UnauthorizedException;
import com.quizplatform.config.SecurityProperties;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final SecurityProperties securityProperties;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       RefreshTokenService refreshTokenService, SecurityProperties securityProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.securityProperties = securityProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, RequestMetadata metadata) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim();
        if (username.isBlank()) {
            throw new BadRequestException("INVALID_USERNAME", "Username is required");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("EMAIL_IN_USE", "An account with that email already exists");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("USERNAME_IN_USE", "That username is already in use");
        }
        UserAccount user = new UserAccount(email, passwordEncoder.encode(request.password()), username);
        userRepository.save(user);
        return response(refreshTokenService.issue(user, metadata), user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, RequestMetadata metadata) {
        String email = normalizeEmail(request.email());
        UserAccount user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Email or password is incorrect");
        }
        if (user.isBanned()) {
            throw new BannedUserException();
        }
        return response(refreshTokenService.issue(user, metadata), user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request, RequestMetadata metadata) {
        TokenPair pair = refreshTokenService.rotate(request.refreshToken(), metadata);
        UserAccount user = userRepository.findById(currentUserIdFromRefresh(request.refreshToken()))
                .orElseThrow(() -> new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid"));
        return response(pair, user);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenService.revoke(request.refreshToken());
    }

    @Transactional
    public void changePassword(UserAccount user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("CURRENT_PASSWORD_INVALID", "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("PASSWORD_UNCHANGED", "New password must be different");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(java.time.Instant.now());
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(user.getId());
    }

    public long accessTokenSeconds() {
        return jwtService.accessTokenExpiresSeconds();
    }

    public SecurityProperties securityProperties() {
        return securityProperties;
    }

    private AuthResponse response(TokenPair pair, UserAccount user) {
        return new AuthResponse(pair.accessToken(), pair.refreshToken(), "Bearer", pair.accessTokenExpiresSeconds(),
                com.quizplatform.user.UserResponse.from(user));
    }

    private java.util.UUID currentUserIdFromRefresh(String rawToken) {
        try {
            return refreshTokenService.userIdForToken(rawToken);
        } catch (RuntimeException exception) {
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
