package com.quizplatform.admin;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminStatsResponse(
        long users,
        long quizzes,
        long categories,
        long attempts,
        @JsonProperty("active_7d") long active7d,
        List<RecentQuizResponse> recentQuizzes,
        List<RecentUserResponse> recentSignups,
        List<RecentAttemptResponse> recentAttempts
) {
    public record RecentQuizResponse(UUID id, String title, Instant createdAt) {
    }

    public record RecentUserResponse(UUID id, String username, String email, Instant createdAt) {
    }

    public record RecentAttemptResponse(UUID id, UUID userId, UUID quizId, int score, int totalQuestions,
                                        Instant completedAt) {
    }
}
