package com.quizplatform.quiz;

import com.quizplatform.category.CategoryResponse;
import com.quizplatform.user.UserReferenceResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizDetailResponse(
        UUID id,
        String title,
        String description,
        UUID categoryId,
        CategoryResponse categories,
        UUID createdBy,
        UserReferenceResponse profiles,
        Difficulty difficulty,
        Integer timeLimit,
        boolean isPublished,
        Instant createdAt,
        long questionCount,
        long attemptCount,
        boolean canEdit,
        List<QuestionResponse> questions
) {
}
