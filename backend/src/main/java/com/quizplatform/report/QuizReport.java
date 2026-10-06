package com.quizplatform.report;

import com.quizplatform.quiz.Quiz;
import com.quizplatform.user.UserAccount;
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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quiz_reports")
public class QuizReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private UserAccount reporter;

    @Column(nullable = false, length = 40)
    private String reason;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false, length = 20)
    private String status = ReportStatus.OPEN.value();

    @Column(name = "resolution_note", length = 500)
    private String resolutionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private UserAccount resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected QuizReport() {
    }

    public QuizReport(Quiz quiz, UserAccount reporter, ReportReason reason, String details) {
        this.quiz = quiz;
        this.reporter = reporter;
        this.reason = reason.value();
        this.details = details;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = Instant.now();
    }

    public void resolve(ReportStatus newStatus, String note, UserAccount admin) {
        this.status = newStatus.value();
        this.resolutionNote = note;
        this.resolvedBy = admin;
        this.resolvedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public UserAccount getReporter() {
        return reporter;
    }

    public String getReason() {
        return reason;
    }

    public String getDetails() {
        return details;
    }

    public String getStatus() {
        return status;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public UserAccount getResolvedBy() {
        return resolvedBy;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
