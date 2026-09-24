package com.quizplatform.user;

import java.util.UUID;

public record UserReferenceResponse(UUID id, String username, String avatarUrl) {
    public static UserReferenceResponse from(UserAccount user) {
        return user == null ? null : new UserReferenceResponse(user.getId(), user.getUsername(), user.getAvatarUrl());
    }
}
