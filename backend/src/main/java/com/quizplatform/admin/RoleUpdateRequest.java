package com.quizplatform.admin;

import com.quizplatform.user.Role;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(@NotNull Role role) {
}
