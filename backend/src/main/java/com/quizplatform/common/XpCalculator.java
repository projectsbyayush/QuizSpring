package com.quizplatform.common;

import com.quizplatform.attempt.XpBreakdown;
import com.quizplatform.quiz.Difficulty;

import java.time.LocalDate;

public final class XpCalculator {

    private XpCalculator() {
    }

    public static XpBreakdown calculate(Difficulty difficulty, int correctCount, int totalQuestions,
                                       Integer timeTakenSeconds, Integer timeLimitSeconds, int streakDays) {
        // Base XP is difficulty XP per correct answer; time bonus is 20% of base,
        // and the daily streak bonus is min(streak days * 5, 50).
        int base = correctCount * difficulty.xpPerCorrect();
        int timeBonus = timeLimitSeconds != null && timeTakenSeconds != null
                && timeTakenSeconds <= timeLimitSeconds
                ? (int) Math.floor(base * 0.20d)
                : 0;
        int streakBonus = Math.min(Math.max(0, streakDays) * 5, 50);
        return new XpBreakdown(base, timeBonus, streakBonus, base + timeBonus + streakBonus);
    }

    public static int nextStreak(LocalDate lastActiveDate, int currentStreak, LocalDate today) {
        if (lastActiveDate == null) {
            return 1;
        }
        if (lastActiveDate.equals(today)) {
            return Math.max(0, currentStreak);
        }
        if (lastActiveDate.equals(today.minusDays(1))) {
            return Math.max(0, currentStreak) + 1;
        }
        return 1;
    }
}
