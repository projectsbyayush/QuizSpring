package com.quizplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.attempts")
public record AttemptProperties(long gracePeriodSeconds) {
}
