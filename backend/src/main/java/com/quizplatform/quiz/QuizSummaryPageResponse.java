package com.quizplatform.quiz;

import java.util.List;

public record QuizSummaryPageResponse(
        List<QuizSummaryResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
