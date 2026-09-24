package com.quizplatform.quiz;

import com.quizplatform.attempt.AttemptService;
import com.quizplatform.attempt.AttemptStartResponse;
import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.common.PageResponse;
import com.quizplatform.user.UserAccount;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/api/quizzes", "/api/v1/quizzes"})
public class QuizController {

    private final QuizService quizService;
    private final CurrentUserService currentUserService;
    private final AttemptService attemptService;

    public QuizController(QuizService quizService, CurrentUserService currentUserService, AttemptService attemptService) {
        this.quizService = quizService;
        this.currentUserService = currentUserService;
        this.attemptService = attemptService;
    }

    @GetMapping
    public PageResponse<QuizSummaryResponse> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(name = "category_id", required = false) UUID categoryIdSnake,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(name = "page_size", required = false) Integer pageSize,
            @RequestParam(name = "includeDrafts", defaultValue = "false") boolean includeDrafts,
            @RequestParam(name = "include_drafts", defaultValue = "false") boolean includeDraftsSnake) {
        UUID viewerId = currentUserService.idOrNull();
        boolean admin = currentUserService.isAdmin();
        boolean drafts = includeDrafts || includeDraftsSnake;
        if (drafts && viewerId == null && !admin) {
            throw new com.quizplatform.common.UnauthorizedException("AUTHENTICATION_REQUIRED", "Authentication is required");
        }
        UUID effectiveCategoryId = categoryId == null ? categoryIdSnake : categoryId;
        int effectiveSize = pageSize == null ? size : pageSize;
        Page<QuizSummaryResponse> result = quizService.list(search, effectiveCategoryId, difficulty, sort, page,
                effectiveSize, viewerId, admin, drafts);
        return PageResponse.from(result);
    }

    @GetMapping("/mine")
    public PageResponse<QuizSummaryResponse> mine(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "9") int size) {
        return PageResponse.from(quizService.mine(currentUserService.id(), page, size));
    }

    @GetMapping("/{id}")
    public QuizDetailResponse get(@PathVariable UUID id) {
        return quizService.get(id, currentUserService.idOrNull(), currentUserService.isAdmin());
    }

    @GetMapping("/recommended")
    @PreAuthorize("isAuthenticated()")
    public java.util.List<QuizSummaryResponse> recommended() {
        return quizService.recommended(currentUserService.id());
    }

    @GetMapping("/{id}/play")
    public QuizDetailResponse play(@PathVariable UUID id) {
        UserAccount actor = currentUserService.activeAccount();
        return quizService.getForPlay(id, actor, currentUserService.isAdmin());
    }

    @PostMapping("/{id}/start")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public AttemptStartResponse start(@PathVariable UUID id) {
        UserAccount actor = currentUserService.activeAccount();
        return attemptService.start(id, actor, currentUserService.isAdmin());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public QuizDetailResponse create(@Valid @RequestBody QuizCreateRequest request) {
        return quizService.create(request, currentUserService.activeAccount());
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public QuizDetailResponse replace(@PathVariable UUID id, @Valid @RequestBody QuizUpdateRequest request) {
        return quizService.update(id, request, currentUserService.activeAccount(), currentUserService.isAdmin());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public QuizDetailResponse patch(@PathVariable UUID id, @Valid @RequestBody QuizPatchRequest request) {
        return quizService.patch(id, request, currentUserService.activeAccount(), currentUserService.isAdmin());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable UUID id) {
        quizService.delete(id, currentUserService.activeAccount(), currentUserService.isAdmin());
    }
}
