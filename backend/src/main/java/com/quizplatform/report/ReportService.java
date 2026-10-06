package com.quizplatform.report;

import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.ConflictException;
import com.quizplatform.common.ForbiddenException;
import com.quizplatform.common.NotFoundException;
import com.quizplatform.common.PageResponse;
import com.quizplatform.quiz.QuizRepository;
import com.quizplatform.quiz.QuizService;
import com.quizplatform.user.UserAccount;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ReportService {

    private static final int ADMIN_PAGE_SIZE = 50;

    private final QuizReportRepository reportRepository;
    private final QuizRepository quizRepository;
    private final QuizService quizService;
    private final CurrentUserService currentUserService;

    public ReportService(QuizReportRepository reportRepository,
                         QuizRepository quizRepository,
                         QuizService quizService,
                         CurrentUserService currentUserService) {
        this.reportRepository = reportRepository;
        this.quizRepository = quizRepository;
        this.quizService = quizService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public QuizReportResponse submit(UUID quizId, SubmitReportRequest request) {
        UserAccount reporter = currentUserService.activeAccount();
        var quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new NotFoundException("QUIZ_NOT_FOUND", "Quiz was not found"));
        if (quiz.isOfficial()) {
            throw new BadRequestException("REPORT_NOT_ALLOWED", "Platform quizzes cannot be reported");
        }
        if (quiz.getCreatedBy() != null && quiz.getCreatedBy().getId().equals(reporter.getId())) {
            throw new BadRequestException("REPORT_OWN_QUIZ", "You cannot report your own quiz");
        }
        if (reportRepository.existsByQuizIdAndReporterIdAndStatus(quizId, reporter.getId(), ReportStatus.OPEN.value())) {
            throw new ConflictException("ALREADY_REPORTED", "You have already reported this quiz");
        }
        String details = request.details() == null ? null : request.details().trim();
        QuizReport report = new QuizReport(quiz, reporter, request.reason(),
                details == null || details.isEmpty() ? null : details);
        return QuizReportResponse.from(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public boolean hasOpenReport(UUID quizId, UUID viewerId) {
        return reportRepository.existsByQuizIdAndReporterIdAndStatus(quizId, viewerId, ReportStatus.OPEN.value());
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizReportResponse> adminPage(String statusValue, int page) {
        requireAdmin();
        String status = ReportStatus.fromValue(statusValue) == null
                ? ReportStatus.OPEN.value()
                : ReportStatus.fromValue(statusValue).value();
        var result = reportRepository.findAdminPage(status,
                PageRequest.of(Math.max(0, page), ADMIN_PAGE_SIZE));
        return PageResponse.from(result.map(QuizReportResponse::from));
    }

    @Transactional
    public QuizReportResponse resolve(UUID reportId, ResolveReportRequest request) {
        requireAdmin();
        UserAccount admin = currentUserService.activeAccount();
        QuizReport report = reportRepository.findWithDetails(reportId)
                .orElseThrow(() -> new NotFoundException("REPORT_NOT_FOUND", "Report was not found"));
        if (!ReportStatus.OPEN.value().equals(report.getStatus())) {
            throw new ConflictException("REPORT_ALREADY_CLOSED", "This report has already been closed");
        }
        if (request.status() == ReportStatus.OPEN) {
            throw new BadRequestException("INVALID_STATUS", "Choose RESOLVED or DISMISSED");
        }
        String note = request.note() == null ? null : request.note().trim();
        report.resolve(request.status(), note == null || note.isEmpty() ? null : note, admin);
        return QuizReportResponse.from(reportRepository.save(report));
    }

    @Transactional
    public void unpublishReportedQuiz(UUID reportId) {
        requireAdmin();
        UserAccount admin = currentUserService.activeAccount();
        QuizReport report = reportRepository.findWithDetails(reportId)
                .orElseThrow(() -> new NotFoundException("REPORT_NOT_FOUND", "Report was not found"));
        quizService.setPublished(report.getQuiz().getId(), false, admin, true);
        report.resolve(ReportStatus.RESOLVED, "Quiz was unpublished by an administrator", admin);
        reportRepository.save(report);
    }

    private void requireAdmin() {
        if (!currentUserService.isAdmin()) {
            throw new ForbiddenException("ADMIN_REQUIRED", "Administrator access is required");
        }
    }
}
