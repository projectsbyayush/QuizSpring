package com.quizplatform.report;

import java.util.Locale;

public enum ReportReason {
    INACCURATE,
    SPAM,
    OFFENSIVE,
    DUPLICATE,
    COPYRIGHT,
    OTHER;

    public String value() {
        return name();
    }

    public static ReportReason fromValue(String value) {
        if (value == null || value.isBlank()) {
            return OTHER;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (ReportReason reason : values()) {
            if (reason.name().equals(normalized)) {
                return reason;
            }
        }
        return OTHER;
    }
}
