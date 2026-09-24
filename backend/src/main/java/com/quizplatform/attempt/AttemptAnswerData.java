package com.quizplatform.attempt;

import java.util.Objects;
import java.util.UUID;

public class AttemptAnswerData {

    private UUID questionId;
    private Integer selected;
    private Integer correctAnswer;
    private boolean correct;

    public AttemptAnswerData() {
    }

    public AttemptAnswerData(UUID questionId, Integer selected, boolean correct) {
        this(questionId, selected, null, correct);
    }

    public AttemptAnswerData(UUID questionId, Integer selected, Integer correctAnswer, boolean correct) {
        this.questionId = questionId;
        this.selected = selected;
        this.correctAnswer = correctAnswer;
        this.correct = correct;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public Integer getSelected() {
        return selected;
    }

    public void setSelected(Integer selected) {
        this.selected = selected;
    }

    public Integer getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(Integer correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AttemptAnswerData that)) {
            return false;
        }
        return correct == that.correct && Objects.equals(questionId, that.questionId) && Objects.equals(selected, that.selected)
                && Objects.equals(correctAnswer, that.correctAnswer);
    }

    @Override
    public int hashCode() {
        return Objects.hash(questionId, selected, correctAnswer, correct);
    }
}
