package com.quizplatform.dashboard;

import com.quizplatform.attempt.AttemptHistoryResponse;
import com.quizplatform.quiz.QuizSummaryResponse;
import com.quizplatform.user.UserResponse;

import java.util.List;

public record DashboardResponse(
        DashboardStatsResponse stats,
        UserResponse profile,
        List<AttemptHistoryResponse> recent,
        List<QuizSummaryResponse> recommended
) {
}
