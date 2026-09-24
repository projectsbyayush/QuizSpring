package com.quizplatform.auth;

import java.time.Duration;

public record TokenPair(String accessToken, String refreshToken, long accessTokenExpiresSeconds) {
    public long refreshTokenExpiresSeconds(Duration duration) {
        return duration.toSeconds();
    }
}
