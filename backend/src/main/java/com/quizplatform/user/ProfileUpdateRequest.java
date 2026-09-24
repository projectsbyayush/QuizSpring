package com.quizplatform.user;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(min = 3, max = 50) String username,
        @Size(max = 2048) String avatarUrl
) {
}
