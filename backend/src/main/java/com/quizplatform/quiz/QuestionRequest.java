package com.quizplatform.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record QuestionRequest(
        @NotBlank @Size(max = 5000) String questionText,
        @NotEmpty @Size(min = 4, max = 4) List<@NotBlank @Size(max = 500) String> options,
        @NotNull @Min(0) @Max(3) Integer correctAnswer,
        @Size(max = 5000) String explanation
) {
}
