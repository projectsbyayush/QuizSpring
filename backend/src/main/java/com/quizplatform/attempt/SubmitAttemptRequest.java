package com.quizplatform.attempt;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record SubmitAttemptRequest(
        UUID quizId,
        @NotNull @JsonProperty("answers") @JsonAlias({"selected_answers", "selectedAnswers"})
        Map<UUID, @Min(0) @Max(3) Integer> answers,
        @Min(0) Integer timeTaken
) {
}
