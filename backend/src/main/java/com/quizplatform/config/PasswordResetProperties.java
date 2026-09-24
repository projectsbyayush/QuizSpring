package com.quizplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.password-reset")
public record PasswordResetProperties(
        String baseUrl,
        long tokenMinutes,
        boolean exposeToken
) {
}
