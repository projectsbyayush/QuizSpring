package com.quizplatform.quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question_text", nullable = false, length = 5000)
    private String text;

    @Column(name = "option_a", nullable = false, length = 500)
    private String optionA;

    @Column(name = "option_b", nullable = false, length = 500)
    private String optionB;

    @Column(name = "option_c", nullable = false, length = 500)
    private String optionC;

    @Column(name = "option_d", nullable = false, length = 500)
    private String optionD;

    @Column(name = "correct_option", nullable = false, length = 1)
    private String correctOption;

    @Column(name = "explanation", length = 5000)
    private String explanation;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    protected Question() {
    }

    public Question(String text, List<String> options, int correctAnswer, String explanation, int orderIndex) {
        this.text = text;
        this.optionA = options.get(0);
        this.optionB = options.get(1);
        this.optionC = options.get(2);
        this.optionD = options.get(3);
        this.correctOption = String.valueOf((char) ('A' + correctAnswer));
        this.explanation = explanation;
        this.orderIndex = orderIndex;
    }

    void attachTo(Quiz quiz) {
        this.quiz = quiz;
    }

    public UUID getId() {
        return id;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public String getText() {
        return text;
    }

    public List<String> getOptions() {
        return List.of(optionA, optionB, optionC, optionD);
    }

    public int getCorrectAnswer() {
        return correctOption.charAt(0) - 'A';
    }

    public String getExplanation() {
        return explanation;
    }

    public int getQuestionOrder() {
        return orderIndex;
    }
}
