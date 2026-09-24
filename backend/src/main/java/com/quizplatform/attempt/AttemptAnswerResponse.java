package com.quizplatform.attempt;

import java.util.List;
import java.util.UUID;

public record AttemptAnswerResponse(
        UUID questionId,
        Integer selected,
        Integer correctAnswer,
        boolean correct,
        String questionText,
        List<String> options,
        String explanation
) {
    public AttemptAnswerResponse(UUID questionId, Integer selected, Integer correctAnswer, boolean correct) {
        this(questionId, selected, correctAnswer, correct, null, List.of(), null);
    }

    public AttemptAnswerResponse(UUID questionId, Integer selected, boolean correct) {
        this(questionId, selected, null, correct, null, List.of(), null);
    }

    public static AttemptAnswerResponse from(AttemptAnswerData answer) {
        return new AttemptAnswerResponse(answer.getQuestionId(), answer.getSelected(), answer.getCorrectAnswer(), answer.isCorrect());
    }
}
