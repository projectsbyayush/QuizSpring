package com.quizplatform.auth;

import com.quizplatform.common.MessageResponse;
import com.quizplatform.user.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService,
                          CurrentUserService currentUserService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.currentUserService = currentUserService;
    }

    @PostMapping({"/register", "/signup"})
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, jakarta.servlet.http.HttpServletRequest servletRequest) {
        return authService.register(request, RequestMetadata.from(servletRequest));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest servletRequest) {
        return authService.login(request, RequestMetadata.from(servletRequest));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request, jakarta.servlet.http.HttpServletRequest servletRequest) {
        return authService.refresh(request, RequestMetadata.from(servletRequest));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return UserResponse.from(currentUserService.activeAccount());
    }

    @PostMapping("/forgot-password")
    public PasswordResetResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.requestReset(request);
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.reset(request);
        return new MessageResponse("Password updated");
    }
}
