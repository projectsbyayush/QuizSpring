package com.quizplatform.attempt;

import com.quizplatform.quiz.QuizSummaryResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AttemptHistoryResponse(
        UUID id,
        UUID userId,
        UUID quizId,
        String status,
        int score,
        int totalQuestions,
        int xpEarned,
        int baseXp,
        int timeBonusXp,
        int streakBonusXp,
        Integer timeTaken,
        Integer timeLimit,
        boolean completedWithinTimeLimit,
        Instant startedAt,
        Instant completedAt,
        List<AttemptAnswerResponse> answers,
        QuizSummaryResponse quiz,
        XpBreakdown xp
) {
    public AttemptHistoryResponse(UUID id, UUID userId, UUID quizId, int score, int totalQuestions, int xpEarned,
                                  Integer timeTaken, Instant completedAt, List<AttemptAnswerResponse> answers,
                                  QuizSummaryResponse quiz) {
        this(id, userId, quizId, "COMPLETED", score, totalQuestions, xpEarned, xpEarned, 0, 0, timeTaken,
                null, true, completedAt, completedAt, answers, quiz,
                new XpBreakdown(xpEarned, 0, 0, xpEarned));
    }
}
