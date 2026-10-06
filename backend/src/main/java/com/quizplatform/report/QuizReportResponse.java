package com.quizplatform.report;

import java.time.Instant;
import java.util.UUID;

public record QuizReportResponse(
        UUID id,
        UUID quizId,
        String quizTitle,
        String quizAuthor,
        String reporterId,
        String reporterUsername,
        String reason,
        String details,
        String status,
        String resolutionNote,
        String resolvedBy,
        Instant resolvedAt,
        Instant createdAt
) {
    public static QuizReportResponse from(QuizReport report) {
        return new QuizReportResponse(
                report.getId(),
                report.getQuiz().getId(),
                report.getQuiz().getTitle(),
                report.getQuiz().getCreatedBy() == null ? null : report.getQuiz().getCreatedBy().getUsername(),
                report.getReporter().getId().toString(),
                report.getReporter().getUsername(),
                report.getReason(),
                report.getDetails(),
                report.getStatus(),
                report.getResolutionNote(),
                report.getResolvedBy() == null ? null : report.getResolvedBy().getUsername(),
                report.getResolvedAt(),
                report.getCreatedAt());
    }
}
