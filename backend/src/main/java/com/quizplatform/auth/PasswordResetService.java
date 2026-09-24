package com.quizplatform.auth;

import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.UnauthorizedException;
import com.quizplatform.config.PasswordResetProperties;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetNotifier notifier;
    private final PasswordResetProperties properties;
    private final RefreshTokenService refreshTokenService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                PasswordResetNotifier notifier,
                                PasswordResetProperties properties,
                                RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.notifier = notifier;
        this.properties = properties;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public PasswordResetResponse requestReset(ForgotPasswordRequest request) {
        Optional<UserAccount> maybeUser = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase(java.util.Locale.ROOT));
        if (maybeUser.isEmpty()) {
            return PasswordResetResponse.sent();
        }
        UserAccount user = maybeUser.get();
        if (!user.isBanned()) {
            Instant now = Instant.now();
            tokenRepository.findByUserIdAndUsedAtIsNull(user.getId()).forEach(existing -> existing.markUsed(now));
            String rawToken = randomToken();
            PasswordResetToken token = new PasswordResetToken(user, hash(rawToken), now.plus(resetDuration()));
            tokenRepository.save(token);
            notifier.sendResetLink(user, rawToken);
            if (properties.exposeToken()) {
                String separator = properties.baseUrl().contains("?") ? "&" : "?";
                log.warn("Development password reset link for {}: {}{}{}", user.getEmail(), properties.baseUrl(),
                        separator, rawToken);
            }
            if (properties.exposeToken()) {
                return PasswordResetResponse.local(rawToken);
            }
        }
        return PasswordResetResponse.sent();
    }

    @Transactional
    public void reset(ResetPasswordRequest request) {
        PasswordResetToken token = tokenRepository.findByTokenHashForUpdate(hash(request.token()))
                .orElseThrow(() -> new UnauthorizedException("INVALID_RESET_TOKEN", "Password reset token is invalid"));
        Instant now = Instant.now();
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw new UnauthorizedException("RESET_TOKEN_EXPIRED", "Password reset token is invalid or expired");
        }
        UserAccount user = token.getUser();
        if (user.isBanned()) {
            throw new UnauthorizedException("ACCOUNT_UNAVAILABLE", "Password reset is unavailable for this account");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(now);
        userRepository.save(user);
        token.markUsed(now);
        tokenRepository.findByUserIdAndUsedAtIsNull(user.getId()).forEach(existing -> existing.markUsed(now));
        tokenRepository.save(token);
        refreshTokenService.revokeAllForUser(user.getId());
    }

    private Duration resetDuration() {
        return Duration.ofMinutes(Math.max(5, properties.tokenMinutes()));
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("INVALID_RESET_TOKEN", "Password reset token is invalid");
        }
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
