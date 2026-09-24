package com.quizplatform.auth;

import com.quizplatform.common.ForbiddenException;
import com.quizplatform.common.UnauthorizedException;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UUID idOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getId();
    }

    public UUID id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("AUTHENTICATION_REQUIRED", "Authentication is required");
        }
        return principal.getId();
    }

    public UserAccount activeAccount() {
        return activeAccount(id());
    }

    public UserAccount activeAccount(UUID userId) {
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("USER_NOT_FOUND", "User account was not found"));
        if (user.isBanned()) {
            throw new ForbiddenException("ACCOUNT_BANNED", "This account is currently suspended");
        }
        return user;
    }

    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal
                && principal.getRole().name().equals("ADMIN");
    }
}
