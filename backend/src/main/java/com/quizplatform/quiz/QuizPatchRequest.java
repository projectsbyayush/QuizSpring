package com.quizplatform.quiz;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record QuizPatchRequest(
        @Size(min = 4, max = 200) String title,
        @Size(max = 5000) String description,
        UUID categoryId,
        Difficulty difficulty,
        @Min(1) Integer timeLimit,
        @JsonProperty("is_published") Boolean isPublished,
        @Size(max = 100) List<@Valid QuestionRequest> questions
) {
}
