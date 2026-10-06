package com.quizplatform.report;

import java.util.Locale;

public enum ReportStatus {
    OPEN,
    RESOLVED,
    DISMISSED;

    public String value() {
        return name();
    }

    public static ReportStatus fromValue(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (ReportStatus status : values()) {
            if (status.name().equals(normalized)) {
                return status;
            }
        }
        return null;
    }
}
