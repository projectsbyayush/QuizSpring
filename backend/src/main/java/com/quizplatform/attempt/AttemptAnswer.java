package com.quizplatform.attempt;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "attempt_answers")
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "selected_option")
    private Integer selectedOption;

    @Column(name = "correct_option", nullable = false)
    private Integer correctOption;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;

    protected AttemptAnswer() {
    }

    public AttemptAnswer(Attempt attempt, UUID questionId, Integer selectedOption, Integer correctOption,
                         boolean correct, int questionOrder) {
        this.attempt = attempt;
        this.questionId = questionId;
        this.selectedOption = selectedOption;
        this.correctOption = correctOption;
        this.correct = correct;
        this.questionOrder = questionOrder;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    public UUID getId() {
        return id;
    }

    public Attempt getAttempt() {
        return attempt;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public Integer getSelectedOption() {
        return selectedOption;
    }

    public Integer getSelected() {
        return selectedOption;
    }

    public Integer getCorrectOption() {
        return correctOption;
    }

    public Integer getCorrectAnswer() {
        return correctOption;
    }

    public boolean isCorrect() {
        return correct;
    }

    public int getQuestionOrder() {
        return questionOrder;
    }
}
