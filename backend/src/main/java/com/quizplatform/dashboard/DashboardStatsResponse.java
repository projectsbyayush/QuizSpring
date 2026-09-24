package com.quizplatform.dashboard;

public record DashboardStatsResponse(
        long attempted,
        int totalXp,
        int level,
        double accuracy,
        long created,
        int streak,
        int currentStreak,
        int longestStreak,
        int xpIntoLevel,
        int xpNeededForNextLevel
) {
    public DashboardStatsResponse(long attempted, int totalXp, int level, double accuracy, long created, int streak,
                                  int currentStreak, int longestStreak) {
        this(attempted, totalXp, level, accuracy, created, streak, currentStreak, longestStreak,
                Math.max(0, totalXp - com.quizplatform.common.LevelCalculator.xpForLevel(level)),
                com.quizplatform.common.LevelCalculator.xpUntilNextLevel(totalXp));
    }

    public DashboardStatsResponse(long attempted, int totalXp, int level, double accuracy, long created, int streak) {
        this(attempted, totalXp, level, accuracy, created, streak, streak, streak);
    }
}
