package com.quizplatform.auth;

import com.quizplatform.common.MessageResponse;
import com.quizplatform.user.ProfileService;
import com.quizplatform.user.ProfileUpdateRequest;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/profile", "/api/v1/profile"})
public class ProfileController {

    private final CurrentUserService currentUserService;
    private final AuthService authService;
    private final ProfileService profileService;

    public ProfileController(CurrentUserService currentUserService, AuthService authService,
                             ProfileService profileService) {
        this.currentUserService = currentUserService;
        this.authService = authService;
        this.profileService = profileService;
    }

    @GetMapping
    public UserResponse get() {
        return profileService.get(currentUserService.activeAccount());
    }

    @PatchMapping
    public UserResponse update(@Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.update(currentUserService.activeAccount(), request);
    }

    @PutMapping
    public UserResponse replace(@Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.update(currentUserService.activeAccount(), request);
    }

    @PostMapping({"/change-password", "/password"})
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        UserAccount user = currentUserService.activeAccount();
        authService.changePassword(user, request);
        return new MessageResponse("Password updated");
    }
}
