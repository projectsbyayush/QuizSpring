package com.quizplatform.admin;

import com.quizplatform.attempt.AttemptService;
import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.auth.RefreshTokenService;
import com.quizplatform.category.CategoryRequest;
import com.quizplatform.category.CategoryResponse;
import com.quizplatform.category.CategoryService;
import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.ConflictException;
import com.quizplatform.common.NotFoundException;
import com.quizplatform.common.PageResponse;
import com.quizplatform.quiz.QuizService;
import com.quizplatform.quiz.QuizSummaryResponse;
import com.quizplatform.user.Role;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import com.quizplatform.user.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final com.quizplatform.quiz.QuizRepository quizRepository;
    private final com.quizplatform.attempt.AttemptRepository attemptRepository;
    private final QuizService quizService;
    private final CategoryService categoryService;
    private final AttemptService attemptService;
    private final CurrentUserService currentUserService;
    private final RefreshTokenService refreshTokenService;

    public AdminService(UserRepository userRepository,
                        com.quizplatform.quiz.QuizRepository quizRepository,
                        com.quizplatform.attempt.AttemptRepository attemptRepository,
                        QuizService quizService,
                        CategoryService categoryService,
                        AttemptService attemptService,
                        CurrentUserService currentUserService,
                        RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.quizService = quizService;
        this.categoryService = categoryService;
        this.attemptService = attemptService;
        this.currentUserService = currentUserService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        requireAdmin();
        var recent = quizRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(quiz -> new AdminStatsResponse.RecentQuizResponse(quiz.getId(), quiz.getTitle(), quiz.getCreatedAt()))
                .toList();
        var recentSignups = userRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(user -> new AdminStatsResponse.RecentUserResponse(user.getId(), user.getUsername(), user.getEmail(),
                        user.getCreatedAt()))
                .toList();
        var recentAttempts = attemptRepository.findTop5ByCompletedAtIsNotNullOrderByCompletedAtDesc().stream()
                .map(attempt -> new AdminStatsResponse.RecentAttemptResponse(attempt.getId(), attempt.getUser().getId(),
                        attempt.getQuiz().getId(), attempt.getScore(), attempt.getTotalQuestions(), attempt.getCompletedAt()))
                .toList();
        return new AdminStatsResponse(userRepository.count(), quizRepository.count(), categoryService.list().size(),
                attemptRepository.countByCompletedAtIsNotNull(),
                attemptRepository.countByCompletedAtAfter(Instant.now().minus(7, ChronoUnit.DAYS)), recent,
                recentSignups, recentAttempts);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> users(String search, String roleValue, int page, int size) {
        return users(search, roleValue, null, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> users(String search, String roleValue, Boolean banned, int page, int size) {
        requireAdmin();
        Role role = parseRole(roleValue);
        Specification<UserAccount> specification = (root, query, criteriaBuilder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern)));
            }
            if (role != null) {
                predicates.add(criteriaBuilder.equal(root.get("role"), role));
            }
            if (banned != null) {
                predicates.add(criteriaBuilder.equal(root.get("banned"), banned));
            }
            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        Page<UserAccount> result = userRepository.findAll(specification,
                PageRequest.of(Math.max(0, page), boundedSize(size), Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.from(result.map(UserResponse::from));
    }

    @Transactional
    public UserResponse updateRole(UUID userId, RoleUpdateRequest request) {
        requireAdmin();
        userRepository.findByRoleForUpdate(Role.ADMIN);
        UserAccount user = findUserForUpdate(userId);
        if (user.getId().equals(currentUserService.id()) && request.role() != Role.ADMIN) {
            throw new BadRequestException("SELF_ROLE_CHANGE_FORBIDDEN", "You cannot remove your own administrator role");
        }
        if (user.getRole() == Role.ADMIN && request.role() != Role.ADMIN
                && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ConflictException("LAST_ADMIN", "At least one administrator must remain");
        }
        user.setRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateBan(UUID userId, boolean banned) {
        return updateBan(userId, new BanUpdateRequest(banned));
    }

    @Transactional
    public UserResponse updateBan(UUID userId, BanUpdateRequest request) {
        requireAdmin();
        userRepository.findByRoleForUpdate(Role.ADMIN);
        UserAccount user = findUserForUpdate(userId);
        if (user.getId().equals(currentUserService.id())) {
            throw new BadRequestException("SELF_BAN_FORBIDDEN", "You cannot ban your own account");
        }
        if (user.getRole() == Role.ADMIN && request.banned() && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ConflictException("LAST_ADMIN", "The last administrator cannot be banned");
        }
        user.setBanned(request.banned());
        userRepository.save(user);
        if (request.banned()) {
            refreshTokenService.revokeAllForUser(user.getId());
        }
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> quizzes(String search, int page, int size) {
        return quizzes(search, null, null, null, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> quizzes(String search, UUID categoryId, String difficulty,
                                                       Boolean published, int page, int size) {
        requireAdmin();
        return PageResponse.from(quizService.list(search, categoryId, difficulty, "newest", page, size,
                currentUserService.id(), true, true, published));
    }

    @Transactional
    public com.quizplatform.quiz.QuizDetailResponse publish(UUID quizId, boolean published) {
        requireAdmin();
        return quizService.setPublished(quizId, published, currentUserService.activeAccount(), true);
    }

    @Transactional
    public com.quizplatform.quiz.QuizDetailResponse updateQuiz(UUID quizId,
                                                                  com.quizplatform.quiz.QuizUpdateRequest request) {
        requireAdmin();
        return quizService.update(quizId, request, currentUserService.activeAccount(), true);
    }

    @Transactional
    public void deleteQuiz(UUID quizId) {
        requireAdmin();
        quizService.delete(quizId, currentUserService.activeAccount(), true);
    }

    @Transactional(readOnly = true)
    public java.util.List<CategoryResponse> categories() {
        requireAdmin();
        return categoryService.list();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        requireAdmin();
        return categoryService.create(request);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        requireAdmin();
        return categoryService.update(id, request);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        requireAdmin();
        categoryService.delete(id);
    }

    @Transactional(readOnly = true)
    public PageResponse<com.quizplatform.attempt.AttemptHistoryResponse> attempts(int page, int size) {
        return attempts("", null, null, null, null, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<com.quizplatform.attempt.AttemptHistoryResponse> attempts(String search, UUID userId,
                                                                                  UUID quizId, Instant from,
                                                                                  Instant to, int page, int size) {
        requireAdmin();
        return attemptService.adminHistory(search, userId, quizId, from, to, page, size);
    }

    private void requireAdmin() {
        if (!currentUserService.isAdmin()) {
            throw new com.quizplatform.common.ForbiddenException("ADMIN_REQUIRED", "Administrator access is required");
        }
    }

    private UserAccount findUserForUpdate(UUID id) {
        return userRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User account was not found"));
    }

    private Role parseRole(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return Role.fromValue(value);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("INVALID_ROLE", "Role must be user or admin");
        }
    }

    private int boundedSize(int size) {
        if (size < 1 || size > 100) {
            throw new BadRequestException("INVALID_PAGE_SIZE", "Page size must be between 1 and 100");
        }
        return size;
    }
}
