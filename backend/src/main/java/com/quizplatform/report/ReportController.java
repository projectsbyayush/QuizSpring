package com.quizplatform.report;

import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api", "/api/v1"})
public class ReportController {

    private final ReportService reportService;
    private final CurrentUserService currentUserService;

    public ReportController(ReportService reportService, CurrentUserService currentUserService) {
        this.reportService = reportService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/quizzes/{quizId}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public QuizReportResponse submit(@PathVariable UUID quizId, @Valid @RequestBody SubmitReportRequest request) {
        return reportService.submit(quizId, request);
    }

    @GetMapping("/quizzes/{quizId}/report/status")
    public Map<String, Boolean> myReportStatus(@PathVariable UUID quizId) {
        UUID viewerId = currentUserService.id();
        return Map.of("reported", reportService.hasOpenReport(quizId, viewerId));
    }

    @GetMapping("/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<QuizReportResponse> list(@RequestParam(defaultValue = "OPEN") String status,
                                                 @RequestParam(defaultValue = "0") int page) {
        return reportService.adminPage(status, page);
    }

    @PatchMapping("/admin/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public QuizReportResponse resolve(@PathVariable UUID id, @Valid @RequestBody ResolveReportRequest request) {
        return reportService.resolve(id, request);
    }

    @PostMapping("/admin/reports/{id}/unpublish-quiz")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unpublishQuiz(@PathVariable UUID id) {
        reportService.unpublishReportedQuiz(id);
    }
}
