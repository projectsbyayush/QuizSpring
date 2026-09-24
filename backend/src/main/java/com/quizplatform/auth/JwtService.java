package com.quizplatform.auth;

import com.quizplatform.config.SecurityProperties;
import com.quizplatform.user.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecurityProperties properties;
    private final SecretKey signingKey;

    public JwtService(SecurityProperties properties) {
        this.properties = properties;
        if (properties.jwtSecret() == null || properties.jwtSecret().isBlank()
                || properties.jwtSecret().contains("replace-with")
                || properties.jwtSecret().getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be a non-placeholder value of at least 32 bytes");
        }
        this.signingKey = Keys.hmacShaKeyFor(properties.jwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(UUID userId, String email, Role role) {
        return createAccessToken(userId, email, role, null);
    }

    public String createAccessToken(UUID userId, String email, Role role, Instant passwordChangedAt) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenDuration());
        var builder = Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role.value())
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .id(UUID.randomUUID().toString());
        if (passwordChangedAt != null) {
            builder.claim("pwd", passwordChangedAt.getEpochSecond());
        }
        return builder.signWith(signingKey).compact();
    }

    public Claims parseAccessToken(String token) throws JwtException {
        Jws<Claims> parsed = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
        Claims claims = parsed.getPayload();
        if (!"access".equals(claims.get("type", String.class))) {
            throw new JwtException("Unexpected token type");
        }
        return claims;
    }

    public UUID userId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public long accessTokenExpiresSeconds() {
        return accessTokenDuration().toSeconds();
    }

    private Duration accessTokenDuration() {
        return Duration.ofMinutes(Math.max(1, properties.accessTokenMinutes()));
    }
}
