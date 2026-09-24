package com.quizplatform.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;

    @jakarta.persistence.Convert(converter = RoleConverter.class)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(name = "total_xp", nullable = false)
    private int totalXp;

    @Column(nullable = false)
    private int level = 1;

    @Column(name = "current_streak", nullable = false)
    private int streak;

    @Column(name = "longest_streak", nullable = false)
    private int longestStreak;

    @Column(name = "last_activity_date")
    private LocalDate lastActiveDate;

    @Column(name = "is_banned", nullable = false)
    private boolean banned;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "password_changed_at", nullable = false)
    private Instant passwordChangedAt;

    protected UserAccount() {
    }

    public UserAccount(String email, String passwordHash, String username) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.username = username;
    }

    public UserAccount(UUID id, String email, String passwordHash, String username) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.username = username;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (passwordChangedAt == null) {
            passwordChangedAt = now;
        }
        if (level < 1) {
            level = 1;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void recordActivity(LocalDate date, int newStreak) {
        this.lastActiveDate = date;
        this.streak = Math.max(0, newStreak);
        this.longestStreak = Math.max(this.longestStreak, this.streak);
    }

    public void addXp(int amount) {
        if (amount <= 0) {
            return;
        }
        totalXp = Math.addExact(totalXp, amount);
        level = com.quizplatform.common.LevelCalculator.levelForXp(totalXp);
    }

    public void removeXp(int amount) {
        if (amount <= 0) {
            return;
        }
        totalXp = Math.max(0, totalXp - amount);
        level = com.quizplatform.common.LevelCalculator.levelForXp(totalXp);
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public int getLevel() {
        return level;
    }

    public int getStreak() {
        return streak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public int getCurrentStreak() {
        return streak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = Math.max(0, longestStreak);
    }

    public LocalDate getLastActiveDate() {
        return lastActiveDate;
    }

    public boolean isBanned() {
        return banned;
    }

    public void setBanned(boolean banned) {
        this.banned = banned;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getPasswordChangedAt() {
        return passwordChangedAt;
    }

    public void setPasswordChangedAt(Instant passwordChangedAt) {
        this.passwordChangedAt = passwordChangedAt;
    }
}
