package com.quizplatform.auth;

import com.quizplatform.common.BannedUserException;
import com.quizplatform.common.UnauthorizedException;
import com.quizplatform.config.SecurityProperties;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
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
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecurityProperties properties;
    private final JwtService jwtService;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               SecurityProperties properties,
                               JwtService jwtService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.properties = properties;
        this.jwtService = jwtService;
    }

    @Transactional
    public TokenPair issue(UserAccount user, RequestMetadata metadata) {
        return issue(user, UUID.randomUUID(), metadata);
    }

    @Transactional(readOnly = true)
    public UUID userIdForToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid");
        }
        return refreshTokenRepository.findByTokenHash(hash(rawToken))
                .map(token -> token.getUser().getId())
                .orElseThrow(() -> new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid"));
    }

    @Transactional(noRollbackFor = UnauthorizedException.class)
    public TokenPair rotate(String rawToken, RequestMetadata metadata) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid");
        }
        String hash = hash(rawToken);
        RefreshToken current = refreshTokenRepository.findByTokenHashForUpdate(hash)
                .orElseThrow(() -> new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid"));
        if (current.getRevokedAt() != null) {
            revokeFamily(current.getFamilyId(), Instant.now());
            throw new UnauthorizedException("REFRESH_TOKEN_REUSE", "Refresh token reuse was detected");
        }
        if (!current.getExpiresAt().isAfter(Instant.now())) {
            current.revoke(Instant.now());
            throw new UnauthorizedException("REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
        }
        UserAccount user = current.getUser();
        if (user.isBanned()) {
            throw new BannedUserException();
        }
        String replacement = randomToken();
        current.replaceWith(hash(replacement));
        current.revoke(Instant.now());
        refreshTokenRepository.save(current);
        return issue(user, current.getFamilyId(), metadata, replacement);
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> token.revoke(Instant.now()));
    }

    @Transactional
    public void revokeAllForUser(UUID userId) {
        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId).forEach(token -> token.revoke(Instant.now()));
    }

    private TokenPair issue(UserAccount user, UUID familyId, RequestMetadata metadata) {
        return issue(user, familyId, metadata, randomToken());
    }

    private TokenPair issue(UserAccount user, UUID familyId, RequestMetadata metadata, String rawToken) {
        Instant expiresAt = Instant.now().plus(refreshDuration());
        RefreshToken token = new RefreshToken(user, hash(rawToken), familyId, expiresAt,
                metadata == null ? null : metadata.userAgent(), metadata == null ? null : metadata.ipAddress());
        refreshTokenRepository.save(token);
        String accessToken = jwtService.createAccessToken(user.getId(), user.getEmail(), user.getRole(),
                user.getPasswordChangedAt());
        return new TokenPair(accessToken, rawToken, jwtService.accessTokenExpiresSeconds());
    }

    private void revokeFamily(UUID familyId, Instant at) {
        refreshTokenRepository.findByFamilyIdAndRevokedAtIsNull(familyId).forEach(token -> token.revoke(at));
    }

    private Duration refreshDuration() {
        return Duration.ofDays(Math.max(1, properties.refreshTokenDays()));
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
