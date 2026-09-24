package com.quizplatform.auth;

import jakarta.servlet.http.HttpServletRequest;

public record RequestMetadata(String userAgent, String ipAddress) {

    public static RequestMetadata from(HttpServletRequest request) {
        String agent = request.getHeader("User-Agent");
        String address = request.getRemoteAddr();
        return new RequestMetadata(trim(agent, 500), trim(address, 64));
    }

    private static String trim(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }
}
