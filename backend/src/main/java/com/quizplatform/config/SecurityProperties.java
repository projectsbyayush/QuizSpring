package com.quizplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(
        String jwtSecret,
        long accessTokenMinutes,
        long refreshTokenDays,
        String corsAllowedOrigins
) {
}
