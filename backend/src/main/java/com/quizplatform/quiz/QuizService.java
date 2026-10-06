package com.quizplatform.quiz;

import com.quizplatform.attempt.Attempt;
import com.quizplatform.attempt.AttemptRepository;
import com.quizplatform.category.Category;
import com.quizplatform.category.CategoryService;
import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.ForbiddenException;
import com.quizplatform.common.ConflictException;
import com.quizplatform.common.NotFoundException;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;

    public QuizService(QuizRepository quizRepository, AttemptRepository attemptRepository,
                        CategoryService categoryService, UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.categoryService = categoryService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<QuizSummaryResponse> list(String search, UUID categoryId, String difficultyValue,
                                          String sortValue, int page, int size, UUID viewerId,
                                          boolean admin, boolean includeDrafts) {
        return list(search, categoryId, difficultyValue, sortValue, page, size, viewerId, admin, includeDrafts, null);
    }

    @Transactional(readOnly = true)
    public Page<QuizSummaryResponse> list(String search, UUID categoryId, String difficultyValue,
                                          String sortValue, int page, int size, UUID viewerId,
                                          boolean admin, boolean includeDrafts, Boolean published) {
        Difficulty difficulty = parseDifficulty(difficultyValue);
        Pageable pageable = PageRequest.of(Math.max(0, page), boundedSize(size), sortFor(sortValue));
        Page<Quiz> result = quizRepository.findAll(
                QuizSpecifications.searchable(search, categoryId, difficulty, viewerId, admin, includeDrafts, published), pageable);
        List<QuizSummaryResponse> content = result.getContent().stream()
                .map(quiz -> toSummary(quiz, viewerId, admin))
                .toList();
        return new org.springframework.data.domain.PageImpl<>(content, pageable, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<QuizSummaryResponse> mine(UUID viewerId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), boundedSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Quiz> result = quizRepository.findAll(QuizSpecifications.ownedBy(viewerId), pageable);
        return result.map(quiz -> toSummary(quiz, viewerId, false));
    }

    @Transactional
    public QuizDetailResponse create(QuizCreateRequest request, UserAccount owner) {
        Category category = categoryService.require(request.categoryId());
        validateQuestions(request.questions());
        Quiz quiz = new Quiz(request.title().trim(), trimToNull(request.description()), category, owner,
                request.difficulty(), request.timeLimit(), request.published() == null || request.published());
        addQuestions(quiz, request.questions());
        return toDetail(quizRepository.save(quiz), owner.getId(), true);
    }

    @Transactional
    public QuizDetailResponse update(UUID id, QuizUpdateRequest request, UserAccount actor, boolean admin) {
        Quiz quiz = requireManageable(id, actor, admin);
        requireNoAttempts(id);
        Category category = categoryService.require(request.categoryId());
        validateQuestions(request.questions());
        boolean published = request.published() == null ? quiz.isPublished() : request.published();
        quiz.update(request.title().trim(), trimToNull(request.description()), category, request.difficulty(),
                request.timeLimit(), published);
        quiz.clearQuestions();
        addQuestions(quiz, request.questions());
        return toDetail(quiz, actor.getId(), true);
    }

    @Transactional
    public QuizDetailResponse patch(UUID id, QuizPatchRequest request, UserAccount actor, boolean admin) {
        Quiz quiz = requireManageable(id, actor, admin);
        requireNoAttempts(id);
        String title = request.title() == null ? quiz.getTitle() : request.title().trim();
        if (title.length() < 4) {
            throw new BadRequestException("INVALID_TITLE", "Quiz title must contain at least four characters");
        }
        Category category = request.categoryId() == null ? quiz.getCategory() : categoryService.require(request.categoryId());
        Difficulty difficulty = request.difficulty() == null ? quiz.getDifficulty() : request.difficulty();
        Integer timeLimit = request.timeLimit() == null ? quiz.getTimeLimit() : request.timeLimit();
        boolean published = request.isPublished() == null ? quiz.isPublished() : request.isPublished();
        String description = request.description() == null ? quiz.getDescription() : trimToNull(request.description());
        if (request.questions() != null) {
            validateQuestions(request.questions());
            quiz.clearQuestions();
            addQuestions(quiz, request.questions());
        }
        quiz.update(title, description, category, difficulty, timeLimit, published);
        return toDetail(quiz, actor.getId(), true);
    }

    @Transactional
    public void delete(UUID id, UserAccount actor, boolean admin) {
        Quiz quiz = requireManageable(id, actor, admin);
        List<Attempt> attempts = attemptRepository.findByQuizId(id);
        for (Attempt attempt : attempts) {
            if (attempt.getCompletedAt() != null && attempt.getXpEarned() > 0) {
                UserAccount user = attempt.getUser();
                user.removeXp(attempt.getXpEarned());
                userRepository.save(user);
            }
        }
        attemptRepository.deleteAll(attempts);
        quizRepository.delete(quiz);
    }

    @Transactional
    public QuizDetailResponse setPublished(UUID id, boolean published, UserAccount actor, boolean admin) {
        if (!admin) {
            throw new ForbiddenException("ADMIN_REQUIRED", "Administrator access is required");
        }
        Quiz quiz = require(id);
        quiz.update(quiz.getTitle(), quiz.getDescription(), quiz.getCategory(), quiz.getDifficulty(),
                quiz.getTimeLimit(), published);
        return toDetail(quiz, actor.getId(), true);
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse get(UUID id, UUID viewerId, boolean admin) {
        Quiz quiz = requireVisible(id, viewerId, admin);
        boolean canEdit = canEdit(quiz, viewerId, admin);
        return toDetail(quiz, viewerId, canEdit);
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getForPlay(UUID id, UserAccount actor, boolean admin) {
        Quiz quiz = requireVisible(id, actor.getId(), admin);
        return toDetail(quiz, actor.getId(), false);
    }

    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> recommended(UUID viewerId) {
        List<UUID> attemptedCategoryIds = viewerId == null
                ? List.of() : attemptRepository.findAttemptedCategoryIds(viewerId);
        java.util.Set<UUID> categories = new java.util.HashSet<>(attemptedCategoryIds);
        java.util.Set<Difficulty> difficulties = viewerId == null
                ? java.util.Set.of() : new java.util.HashSet<>(attemptRepository.findAttemptedDifficulties(viewerId));
        java.util.Map<UUID, Quiz> candidates = new java.util.LinkedHashMap<>();
        quizRepository.findTop100ByPublishedTrueOrderByCreatedAtDesc().forEach(quiz -> {
            if (viewerId == null || quiz.getCreatedBy() == null
                    || !viewerId.equals(quiz.getCreatedBy().getId())) {
                candidates.put(quiz.getId(), quiz);
            }
        });
        if (viewerId != null && !attemptedCategoryIds.isEmpty()) {
            quizRepository.findRecommendedByCategories(viewerId, attemptedCategoryIds, PageRequest.of(0, 100))
                    .forEach(quiz -> candidates.put(quiz.getId(), quiz));
        }
        if (viewerId != null && !difficulties.isEmpty()) {
            quizRepository.findRecommendedByDifficulties(viewerId, difficulties, PageRequest.of(0, 100))
                    .forEach(quiz -> candidates.put(quiz.getId(), quiz));
        }
        return candidates.values().stream()
                .filter(Quiz::isPublished)
                .sorted(java.util.Comparator.comparingInt((Quiz quiz) -> recommendationScore(quiz, categories, difficulties))
                        .reversed()
                        .thenComparing(Quiz::getCreatedAt, java.util.Comparator.nullsLast(
                                java.util.Comparator.reverseOrder())))
                .limit(6)
                .map(quiz -> toSummary(quiz, viewerId, false))
                .toList();
    }

    private int recommendationScore(Quiz quiz, java.util.Set<UUID> categories,
                                    java.util.Set<Difficulty> difficulties) {
        int score = 0;
        if (quiz.getCategory() != null && categories.contains(quiz.getCategory().getId())) {
            score += 4;
        }
        if (difficulties.contains(quiz.getDifficulty())) {
            score += 2;
        }
        return score;
    }

    @Transactional
    public Quiz lockForSubmission(UUID id) {
        return quizRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("QUIZ_NOT_FOUND", "Quiz was not found"));
    }

    @Transactional(readOnly = true)
    public Quiz require(UUID id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("QUIZ_NOT_FOUND", "Quiz was not found"));
    }

    @Transactional(readOnly = true)
    public Quiz requireVisible(UUID id, UUID viewerId, boolean admin) {
        Quiz quiz = require(id);
        if (!quiz.isPublished() && !admin && (viewerId == null || quiz.getCreatedBy() == null
                || !quiz.getCreatedBy().getId().equals(viewerId))) {
            throw new NotFoundException("QUIZ_NOT_FOUND", "Quiz was not found");
        }
        return quiz;
    }

    private void requireNoAttempts(UUID quizId) {
        if (attemptRepository.countByQuizId(quizId) > 0) {
            throw new ConflictException("QUIZ_HAS_ATTEMPTS", "Quizzes with attempts cannot be edited");
        }
    }

    private Quiz requireManageable(UUID id, UserAccount actor, boolean admin) {
        Quiz quiz = quizRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("QUIZ_NOT_FOUND", "Quiz was not found"));
        if (!admin && (quiz.getCreatedBy() == null || !quiz.getCreatedBy().getId().equals(actor.getId()))) {
            throw new ForbiddenException("QUIZ_OWNERSHIP_REQUIRED", "Only the quiz owner or an administrator can modify it");
        }
        return quiz;
    }

    private boolean canEdit(Quiz quiz, UUID viewerId, boolean admin) {
        return admin || viewerId != null && quiz.getCreatedBy() != null && quiz.getCreatedBy().getId().equals(viewerId);
    }

    private void addQuestions(Quiz quiz, List<QuestionRequest> requests) {
        for (int index = 0; index < requests.size(); index++) {
            QuestionRequest request = requests.get(index);
            List<String> options = request.options().stream().map(String::trim).toList();
            quiz.addQuestion(new Question(request.questionText().trim(), options, request.correctAnswer(),
                    trimToNull(request.explanation()), index));
        }
    }

    private void validateQuestions(List<QuestionRequest> questions) {
        if (questions == null || questions.isEmpty()) {
            throw new BadRequestException("QUESTIONS_REQUIRED", "At least one question is required");
        }
        for (QuestionRequest question : questions) {
            if (question.options() == null || question.options().size() != 4
                    || question.options().stream().anyMatch(option -> option == null || option.isBlank())) {
                throw new BadRequestException("INVALID_QUESTION_OPTIONS", "Each question must have four non-empty options");
            }
            if (question.correctAnswer() == null || question.correctAnswer() < 0 || question.correctAnswer() > 3) {
                throw new BadRequestException("INVALID_CORRECT_ANSWER", "Correct answer must be between 0 and 3");
            }
        }
    }

    public QuizSummaryResponse summary(Quiz quiz, UUID viewerId, boolean admin) {
        return toSummary(quiz, viewerId, admin);
    }

    private QuizSummaryResponse toSummary(Quiz quiz, UUID viewerId, boolean admin) {
        boolean canEdit = canEdit(quiz, viewerId, admin);
        return new QuizSummaryResponse(quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                quiz.getCategory() == null ? null : quiz.getCategory().getId(),
                quiz.getCategory() == null ? null : com.quizplatform.category.CategoryResponse.from(quiz.getCategory()),
                quiz.getCreatedBy() == null ? null : quiz.getCreatedBy().getId(),
                quiz.getCreatedBy() == null ? null : com.quizplatform.user.UserReferenceResponse.from(quiz.getCreatedBy()),
                quiz.getDifficulty(), quiz.getTimeLimit(), quiz.isPublished(), quiz.getCreatedAt(),
                quiz.getQuestions().size(), quiz.getAttemptCount(), quiz.isOfficial(), canEdit);
    }

    private QuizDetailResponse toDetail(Quiz quiz, UUID viewerId, boolean includeAnswers) {
        boolean canEdit = includeAnswers;
        return new QuizDetailResponse(quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                quiz.getCategory() == null ? null : quiz.getCategory().getId(),
                quiz.getCategory() == null ? null : com.quizplatform.category.CategoryResponse.from(quiz.getCategory()),
                quiz.getCreatedBy() == null ? null : quiz.getCreatedBy().getId(),
                quiz.getCreatedBy() == null ? null : com.quizplatform.user.UserReferenceResponse.from(quiz.getCreatedBy()),
                quiz.getDifficulty(), quiz.getTimeLimit(), quiz.isPublished(), quiz.getCreatedAt(),
                quiz.getQuestions().size(), quiz.getAttemptCount(), canEdit,
                quiz.getQuestions().stream().map(question -> QuestionResponse.from(question, includeAnswers)).toList());
    }

    private Sort sortFor(String value) {
        if ("title".equalsIgnoreCase(value)) {
            return Sort.by(Sort.Direction.ASC, "title");
        }
        if ("popular".equalsIgnoreCase(value)) {
            return Sort.by(Sort.Direction.DESC, "attemptCount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private Difficulty parseDifficulty(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return Difficulty.fromValue(value);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("INVALID_DIFFICULTY", "Difficulty must be Easy, Medium, or Hard");
        }
    }

    private int boundedSize(int size) {
        if (size < 1 || size > 100) {
            throw new BadRequestException("INVALID_PAGE_SIZE", "Page size must be between 1 and 100");
        }
        return size;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
