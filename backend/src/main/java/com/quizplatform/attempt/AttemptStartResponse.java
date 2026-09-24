package com.quizplatform.attempt;

import com.quizplatform.quiz.QuestionResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AttemptStartResponse(
        UUID attemptId,
        UUID quizId,
        String status,
        Instant startedAt,
        Instant expiresAt,
        Integer timeLimit,
        long gracePeriodSeconds,
        List<QuestionResponse> questions
) {
}
