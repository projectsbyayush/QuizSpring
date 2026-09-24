package com.quizplatform.common;

import com.quizplatform.attempt.XpBreakdown;
import com.quizplatform.quiz.Difficulty;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class XpCalculatorTest {

    @Test
    void calculatesTimeAndStreakBonuses() {
        XpBreakdown result = XpCalculator.calculate(Difficulty.EASY, 2, 3, 30, 600, 3);

        assertEquals(20, result.base());
        assertEquals(4, result.timeBonus());
        assertEquals(15, result.streakBonus());
        assertEquals(39, result.total());
    }

    @Test
    void awardsTimeBonusForAnyTimedSubmissionWithBaseXp() {
        XpBreakdown result = XpCalculator.calculate(Difficulty.EASY, 1, 2, 10, 600, 1);

        assertEquals(2, result.timeBonus());
        assertEquals(17, result.total());
    }

    @Test
    void givesTimeBonusAndFirstDayStreakBonus() {
        XpBreakdown result = XpCalculator.calculate(Difficulty.HARD, 2, 2, 120, 600, 1);

        assertEquals(60, result.base());
        assertEquals(12, result.timeBonus());
        assertEquals(5, result.streakBonus());
        assertEquals(77, result.total());
    }

    @Test
    void capsStreakBonusAtFifty() {
        XpBreakdown result = XpCalculator.calculate(Difficulty.MEDIUM, 1, 1, 600, null, 20);

        assertEquals(50, result.streakBonus());
        assertEquals(70, result.total());
    }

    @Test
    void calculatesFirstConsecutiveSameDayAndBrokenStreak() {
        LocalDate today = LocalDate.of(2026, 9, 24);

        assertEquals(1, XpCalculator.nextStreak(null, 0, today));
        assertEquals(4, XpCalculator.nextStreak(today.minusDays(1), 3, today));
        assertEquals(4, XpCalculator.nextStreak(today, 4, today));
        assertEquals(1, XpCalculator.nextStreak(today.minusDays(3), 4, today));
    }

    @Test
    void calculatesLevelFromTotalXp() {
        assertEquals(1, LevelCalculator.levelForXp(0));
        assertEquals(2, LevelCalculator.levelForXp(100));
        assertEquals(4, LevelCalculator.levelForXp(900));
    }
}
