package com.quizplatform.auth;

import com.quizplatform.common.MessageResponse;
import com.quizplatform.user.ProfileService;
import com.quizplatform.user.ProfileUpdateRequest;
import com.quizplatform.user.UserResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/users/me", "/api/v1/users/me"})
public class UserMeController {

    private final CurrentUserService currentUserService;
    private final ProfileService profileService;
    private final AuthService authService;

    public UserMeController(CurrentUserService currentUserService, ProfileService profileService, AuthService authService) {
        this.currentUserService = currentUserService;
        this.profileService = profileService;
        this.authService = authService;
    }

    @GetMapping("/profile")
    public UserResponse profile() {
        return profileService.get(currentUserService.activeAccount());
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.update(currentUserService.activeAccount(), request);
    }

    @PutMapping("/password")
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUserService.activeAccount(), request);
        return new MessageResponse("Password updated");
    }

    @PostMapping("/password")
    public MessageResponse postPassword(@Valid @RequestBody ChangePasswordRequest request) {
        return changePassword(request);
    }
}
