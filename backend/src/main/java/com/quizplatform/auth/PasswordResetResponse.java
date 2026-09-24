package com.quizplatform.auth;

public record PasswordResetResponse(String message, String token) {
    public static PasswordResetResponse sent() {
        return new PasswordResetResponse("If an account exists for that email, a reset link has been sent.", null);
    }

    public static PasswordResetResponse local(String token) {
        return new PasswordResetResponse("Password reset token generated for local development.", token);
    }
}
