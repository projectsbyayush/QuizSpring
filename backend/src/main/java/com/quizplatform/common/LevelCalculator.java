package com.quizplatform.common;

public final class LevelCalculator {

    private LevelCalculator() {
    }

    public static int levelForXp(int totalXp) {
        if (totalXp <= 0) {
            return 1;
        }
        return (int) Math.floor(Math.sqrt(totalXp / 100.0)) + 1;
    }

    public static int xpForLevel(int level) {
        int safeLevel = Math.max(1, level);
        return (safeLevel - 1) * (safeLevel - 1) * 100;
    }

    public static int xpUntilNextLevel(int totalXp) {
        int nextLevel = levelForXp(totalXp) + 1;
        return Math.max(0, xpForLevel(nextLevel) - Math.max(0, totalXp));
    }
}
