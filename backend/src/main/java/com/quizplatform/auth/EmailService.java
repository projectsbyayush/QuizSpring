package com.quizplatform.auth;

import com.quizplatform.user.UserAccount;

public interface EmailService {
    void sendResetLink(UserAccount user, String rawToken);
}
