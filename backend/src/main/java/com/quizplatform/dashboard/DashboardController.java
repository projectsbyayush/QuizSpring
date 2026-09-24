package com.quizplatform.dashboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/dashboard", "/api/v1/dashboard", "/api/users/me/dashboard", "/api/v1/users/me/dashboard"})
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardResponse get() {
        return dashboardService.get();
    }

    @GetMapping("/stats")
    public DashboardStatsResponse stats() {
        return dashboardService.get().stats();
    }

    @GetMapping("/recommendations")
    public java.util.List<com.quizplatform.quiz.QuizSummaryResponse> recommendations() {
        return dashboardService.get().recommended();
    }
}
