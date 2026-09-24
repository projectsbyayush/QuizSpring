package com.quizplatform.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(new com.quizplatform.config.SecurityProperties(
            "test-secret-that-is-long-enough-for-hmac-sha-256-signing", 15, 30,
            "http://localhost:5173"));

    @Test
    void createsAndParsesAccessToken() {
        String token = jwtService.createAccessToken(java.util.UUID.randomUUID(), "user@example.com",
                com.quizplatform.user.Role.USER);

        var claims = jwtService.parseAccessToken(token);

        assertEquals("user@example.com", claims.get("email", String.class));
        assertEquals("user", claims.get("role", String.class));
        assertEquals("access", claims.get("type", String.class));
    }

    @Test
    void tokensForDifferentUsersAreDifferent() {
        var first = jwtService.createAccessToken(java.util.UUID.randomUUID(), "a@example.com",
                com.quizplatform.user.Role.USER);
        var second = jwtService.createAccessToken(java.util.UUID.randomUUID(), "b@example.com",
                com.quizplatform.user.Role.USER);

        assertNotEquals(first, second);
    }
}
