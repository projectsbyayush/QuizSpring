package com.quizplatform.user;

import com.quizplatform.user.Role;

import java.time.Instant;
import java.time.LocalDate;

public record UserResponse(
        String id,
        String email,
        String username,
        String avatarUrl,
        Role role,
        int totalXp,
        int level,
        int streak,
        int currentStreak,
        int longestStreak,
        LocalDate lastActiveDate,
        boolean isBanned,
        Instant createdAt
) {
    public UserResponse(String id, String email, String username, String avatarUrl, Role role, int totalXp,
                        int level, int streak, LocalDate lastActiveDate, boolean isBanned, Instant createdAt) {
        this(id, email, username, avatarUrl, role, totalXp, level, streak, streak, streak, lastActiveDate,
                isBanned, createdAt);
    }

    public static UserResponse from(UserAccount user) {
        return new UserResponse(user.getId().toString(), user.getEmail(), user.getUsername(), user.getAvatarUrl(),
                user.getRole(), user.getTotalXp(), user.getLevel(), user.getStreak(), user.getCurrentStreak(),
                user.getLongestStreak(), user.getLastActiveDate(), user.isBanned(), user.getCreatedAt());
    }
}
