package com.quizplatform.common;

import org.springframework.http.HttpStatus;

public class BannedUserException extends ApiException {

    public BannedUserException() {
        super(HttpStatus.FORBIDDEN, "ACCOUNT_BANNED", "This account is currently suspended");
    }
}
