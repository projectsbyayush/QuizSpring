package com.quizplatform.attempt;

import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.common.PageResponse;
import com.quizplatform.user.UserAccount;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/api/attempts", "/api/v1/attempts"})
public class AttemptController {

    private final AttemptService attemptService;
    private final CurrentUserService currentUserService;

    public AttemptController(AttemptService attemptService, CurrentUserService currentUserService) {
        this.attemptService = attemptService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/{id}/submit")
    public AttemptResponse submit(@PathVariable UUID id, @Valid @RequestBody SubmitAttemptRequest request) {
        UserAccount actor = currentUserService.activeAccount();
        return attemptService.submit(id, request, actor, currentUserService.isAdmin());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttemptResponse legacySubmit(@Valid @RequestBody SubmitAttemptRequest request) {
        UserAccount actor = currentUserService.activeAccount();
        return attemptService.submit(request, actor, currentUserService.isAdmin());
    }

    @GetMapping("/mine")
    public PageResponse<AttemptHistoryResponse> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return attemptService.history(currentUserService.activeAccount(), page, size);
    }

    @GetMapping
    public PageResponse<AttemptHistoryResponse> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return attemptService.history(currentUserService.activeAccount(), page, size);
    }

    @GetMapping("/accuracy")
    public AccuracyResponse accuracy() {
        return attemptService.accuracy(currentUserService.activeAccount());
    }

    @GetMapping("/{id}")
    public AttemptHistoryResponse get(@PathVariable UUID id) {
        UserAccount actor = currentUserService.activeAccount();
        return attemptService.get(id, actor, currentUserService.isAdmin());
    }
}
