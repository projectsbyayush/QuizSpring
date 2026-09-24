package com.quizplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed.admin")
public record SeedAdminProperties(
        boolean enabled,
        String email,
        String username,
        String password
) {
}
