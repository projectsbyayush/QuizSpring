package com.quizplatform.admin;

import com.quizplatform.attempt.AttemptHistoryResponse;
import com.quizplatform.category.CategoryRequest;
import com.quizplatform.category.CategoryResponse;
import com.quizplatform.common.PageResponse;
import com.quizplatform.quiz.QuizPublishRequest;
import com.quizplatform.quiz.QuizSummaryResponse;
import com.quizplatform.user.UserResponse;
import jakarta.validation.Valid;
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
import org.springframework.format.annotation.DateTimeFormat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    public PageResponse<UserResponse> users(@RequestParam(defaultValue = "") String search,
                                           @RequestParam(defaultValue = "all") String role,
                                           @RequestParam(required = false) Boolean banned,
                                           @RequestParam(name = "is_banned", required = false) Boolean bannedSnake,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "50") int size) {
        return adminService.users(search, role, banned == null ? bannedSnake : banned, page, size);
    }

    @PatchMapping("/users/{id}/role")
    public UserResponse updateRole(@PathVariable UUID id, @Valid @RequestBody RoleUpdateRequest request) {
        return adminService.updateRole(id, request);
    }

    @PatchMapping("/users/{id}/ban")
    public UserResponse updateBan(@PathVariable UUID id, @Valid @RequestBody BanUpdateRequest request) {
        return adminService.updateBan(id, request);
    }

    @PatchMapping("/users/{id}/unban")
    public UserResponse unbanUser(@PathVariable UUID id) {
        return adminService.updateBan(id, false);
    }

    @GetMapping("/quizzes")
    public PageResponse<QuizSummaryResponse> quizzes(@RequestParam(defaultValue = "") String search,
                                                     @RequestParam(required = false) UUID categoryId,
                                                     @RequestParam(name = "category_id", required = false) UUID categoryIdSnake,
                                                     @RequestParam(required = false) String difficulty,
                                                     @RequestParam(name = "is_published", required = false) Boolean published,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "50") int size) {
        return adminService.quizzes(search, categoryId == null ? categoryIdSnake : categoryId, difficulty,
                published, page, size);
    }

    @PatchMapping("/quizzes/{id}/publish")
    public com.quizplatform.quiz.QuizDetailResponse publish(@PathVariable UUID id, @Valid @RequestBody QuizPublishRequest request) {
        return adminService.publish(id, request.published());
    }

    @PutMapping("/quizzes/{id}")
    public com.quizplatform.quiz.QuizDetailResponse updateQuiz(
            @PathVariable UUID id, @Valid @RequestBody com.quizplatform.quiz.QuizUpdateRequest request) {
        return adminService.updateQuiz(id, request);
    }

    @DeleteMapping("/quizzes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuiz(@PathVariable UUID id) {
        adminService.deleteQuiz(id);
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return adminService.categories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return adminService.createCategory(request);
    }

    @PutMapping("/categories/{id}")
    public CategoryResponse updateCategory(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        return adminService.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable UUID id) {
        adminService.deleteCategory(id);
    }

    @GetMapping("/attempts")
    public PageResponse<AttemptHistoryResponse> attempts(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "user_id", required = false) UUID userIdSnake,
            @RequestParam(name = "quizId", required = false) UUID quizId,
            @RequestParam(name = "quiz_id", required = false) UUID quizIdSnake,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return adminService.attempts(search, userId == null ? userIdSnake : userId,
                quizId == null ? quizIdSnake : quizId, from, to, page, size);
    }
}
