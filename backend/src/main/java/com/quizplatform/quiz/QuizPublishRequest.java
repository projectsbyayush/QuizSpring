package com.quizplatform.quiz;

import com.fasterxml.jackson.annotation.JsonProperty;

public record QuizPublishRequest(@JsonProperty("is_published") boolean published) {
}
