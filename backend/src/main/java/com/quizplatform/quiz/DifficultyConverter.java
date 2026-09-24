package com.quizplatform.quiz;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DifficultyConverter implements AttributeConverter<Difficulty, String> {

    @Override
    public String convertToDatabaseColumn(Difficulty difficulty) {
        return difficulty == null ? null : difficulty.value();
    }

    @Override
    public Difficulty convertToEntityAttribute(String value) {
        return value == null ? null : Difficulty.fromValue(value);
    }
}
