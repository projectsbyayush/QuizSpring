package com.quizplatform.quiz;

import com.quizplatform.category.Category;
import com.quizplatform.user.UserAccount;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quizzes")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 5000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private UserAccount createdBy;

    @jakarta.persistence.Convert(converter = DifficultyConverter.class)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Column(name = "time_limit_seconds")
    private Integer timeLimit;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    @Column(name = "is_official", nullable = false)
    private boolean official = false;

    @Column(name = "attempt_count", nullable = false)
    private long attemptCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<Question> questions = new ArrayList<>();

    protected Quiz() {
    }

    public Quiz(String title, String description, Category category, UserAccount createdBy,
                Difficulty difficulty, Integer timeLimit, boolean published) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.createdBy = createdBy;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        this.published = published;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void update(String title, String description, Category category, Difficulty difficulty,
                       Integer timeLimit, boolean published) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        this.published = published;
    }

    public void clearQuestions() {
        questions.clear();
    }

    public void addQuestion(Question question) {
        question.attachTo(this);
        questions.add(question);
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Category getCategory() {
        return category;
    }

    public UserAccount getCreatedBy() {
        return createdBy;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public Integer getTimeLimit() {
        return timeLimit;
    }

    public boolean isPublished() {
        return published;
    }

    public boolean isOfficial() {
        return official;
    }

    public void setOfficial(boolean official) {
        this.official = official;
    }

    public long getAttemptCount() {
        return attemptCount;
    }

    public void incrementAttemptCount() {
        attemptCount = Math.addExact(attemptCount, 1L);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<Question> getQuestions() {
        return questions;
    }
}
