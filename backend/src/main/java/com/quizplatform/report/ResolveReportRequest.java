package com.quizplatform.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveReportRequest(
        @NotNull(message = "Choose an outcome") ReportStatus status,
        @Size(max = 500, message = "Keep notes under 500 characters") String note
) {
}
