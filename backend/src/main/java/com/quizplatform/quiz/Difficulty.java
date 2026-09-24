package com.quizplatform.quiz;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Difficulty {
    EASY("Easy"),
    MEDIUM("Medium"),
    HARD("Hard");

    private final String value;

    Difficulty(String value) {
        this.value = value;
    }

    public int xpPerCorrect() {
        return switch (this) {
            case EASY -> 10;
            case MEDIUM -> 20;
            case HARD -> 30;
        };
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static Difficulty fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (Difficulty difficulty : values()) {
            if (difficulty.value.equalsIgnoreCase(value)) {
                return difficulty;
            }
        }
        throw new IllegalArgumentException("Unknown difficulty");
    }
}
