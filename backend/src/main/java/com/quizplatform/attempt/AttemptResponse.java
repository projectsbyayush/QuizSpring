package com.quizplatform.attempt;

import com.quizplatform.quiz.QuizSummaryResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AttemptResponse(
        UUID attemptId,
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
        XpBreakdown xp,
        List<AttemptAnswerResponse> answers,
        QuizSummaryResponse quiz
) {
    public AttemptResponse(UUID attemptId, UUID quizId, int score, int totalQuestions, int xpEarned,
                           Integer timeTaken, Instant completedAt, XpBreakdown xp,
                           List<AttemptAnswerResponse> answers, QuizSummaryResponse quiz) {
        this(attemptId, quizId, "COMPLETED", score, totalQuestions, xpEarned,
                xp == null ? xpEarned : xp.base(), xp == null ? 0 : xp.timeBonus(),
                xp == null ? 0 : xp.streakBonus(), timeTaken, null, true, completedAt, completedAt,
                xp, answers, quiz);
    }
}
