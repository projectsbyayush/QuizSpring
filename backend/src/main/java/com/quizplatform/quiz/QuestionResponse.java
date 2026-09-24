package com.quizplatform.quiz;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionResponse(
        UUID id,
        UUID quizId,
        String questionText,
        List<String> options,
        Integer correctAnswer,
        String explanation,
        int order
) {
    public static QuestionResponse from(Question question, boolean includeAnswer) {
        return new QuestionResponse(question.getId(), question.getQuiz().getId(), question.getText(),
                List.copyOf(question.getOptions()), includeAnswer ? question.getCorrectAnswer() : null,
                includeAnswer ? question.getExplanation() : null, question.getQuestionOrder());
    }
}
