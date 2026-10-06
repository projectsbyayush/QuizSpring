package com.quizplatform.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitReportRequest(
        @NotNull(message = "Choose a reason") ReportReason reason,
        @Size(max = 1000, message = "Keep details under 1000 characters") String details
) {
}
