package com.quizplatform.attempt;

import com.quizplatform.quiz.Quiz;
import com.quizplatform.user.UserAccount;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "attempts")
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false)
    private int score;

    @Column(name = "total_questions", nullable = false)
    private int totalQuestions;

    @Column(name = "correct_answers", nullable = false)
    private int correctAnswers;

    @Column(name = "xp_earned", nullable = false)
    private int xpEarned;

    @Column(name = "base_xp", nullable = false)
    private int baseXp;

    @Column(name = "time_bonus_xp", nullable = false)
    private int timeBonusXp;

    @Column(name = "streak_bonus_xp", nullable = false)
    private int streakBonusXp;

    @Column(name = "time_taken_seconds")
    private Integer timeTaken;

    @Column(name = "time_limit_seconds")
    private Integer timeLimit;

    @Column(name = "completed_within_time_limit", nullable = false)
    private boolean completedWithinTimeLimit;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answers", nullable = false, columnDefinition = "jsonb")
    private List<AttemptAnswerData> legacyAnswers = new ArrayList<>();

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    private List<AttemptAnswer> answerRows = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttemptStatus status = AttemptStatus.COMPLETED;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected Attempt() {
    }

    public Attempt(UserAccount user, Quiz quiz, int totalQuestions, Integer timeLimit, Instant startedAt) {
        this.user = user;
        this.quiz = quiz;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = 0;
        this.timeLimit = timeLimit;
        this.startedAt = startedAt;
        this.status = AttemptStatus.PENDING;
        this.completedAt = null;
    }

    public Attempt(UserAccount user, Quiz quiz, int score, int totalQuestions, int xpEarned,
                   Integer timeTaken, List<AttemptAnswerData> answers) {
        this.user = user;
        this.quiz = quiz;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = score;
        this.xpEarned = xpEarned;
        this.baseXp = xpEarned;
        this.timeTaken = timeTaken;
        this.timeLimit = null;
        this.completedWithinTimeLimit = true;
        this.legacyAnswers = new ArrayList<>(answers);
        this.status = AttemptStatus.COMPLETED;
        this.startedAt = Instant.now();
        this.completedAt = Instant.now();
        for (AttemptAnswerData answer : answers) {
            answerRows.add(new AttemptAnswer(this, answer.getQuestionId(), answer.getSelected(),
                    answer.getCorrectAnswer(), answer.isCorrect(), answerRows.size()));
        }
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (startedAt == null) {
            startedAt = Instant.now();
        }
        if (status == null) {
            status = completedAt == null ? AttemptStatus.PENDING : AttemptStatus.COMPLETED;
        }
        if (status == AttemptStatus.PENDING) {
            completedAt = null;
        } else if (completedAt == null) {
            completedAt = Instant.now();
        }
    }

    public void complete(int score, int totalQuestions, int xpEarned, Integer timeTaken,
                         boolean completedWithinTimeLimit, XpBreakdown xp, List<AttemptAnswerData> answers,
                         Instant completedAt) {
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = score;
        this.xpEarned = xpEarned;
        this.baseXp = xp.base();
        this.timeBonusXp = xp.timeBonus();
        this.streakBonusXp = xp.streakBonus();
        this.timeTaken = timeTaken;
        this.completedWithinTimeLimit = completedWithinTimeLimit;
        this.legacyAnswers = new ArrayList<>(answers);
        this.status = AttemptStatus.COMPLETED;
        this.completedAt = completedAt;
        answerRows.clear();
        for (int index = 0; index < answers.size(); index++) {
            AttemptAnswerData answer = answers.get(index);
            answerRows.add(new AttemptAnswer(this, answer.getQuestionId(), answer.getSelected(),
                    answer.getCorrectAnswer(), answer.isCorrect(), index));
        }
    }

    public UUID getId() {
        return id;
    }

    public UserAccount getUser() {
        return user;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public int getScore() {
        return score;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public int getXpEarned() {
        return xpEarned;
    }

    public int getBaseXp() {
        return baseXp;
    }

    public int getTimeBonusXp() {
        return timeBonusXp;
    }

    public int getStreakBonusXp() {
        return streakBonusXp;
    }

    public Integer getTimeTaken() {
        return timeTaken;
    }

    public Integer getTimeLimit() {
        return timeLimit;
    }

    public boolean isCompletedWithinTimeLimit() {
        return completedWithinTimeLimit;
    }

    public List<AttemptAnswerData> getAnswers() {
        if (!answerRows.isEmpty()) {
            return answerRows.stream().map(answer -> new AttemptAnswerData(answer.getQuestionId(),
                    answer.getSelectedOption(), answer.getCorrectOption(), answer.isCorrect())).toList();
        }
        return List.copyOf(legacyAnswers);
    }

    public List<AttemptAnswer> getAnswerRows() {
        return answerRows;
    }

    public AttemptStatus getStatus() {
        return status;
    }

    public boolean isPending() {
        return status == AttemptStatus.PENDING;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}
