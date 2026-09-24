package com.quizplatform.attempt;

import com.quizplatform.common.BadRequestException;
import com.quizplatform.common.ConflictException;
import com.quizplatform.common.ForbiddenException;
import com.quizplatform.common.NotFoundException;
import com.quizplatform.common.PageResponse;
import com.quizplatform.common.XpCalculator;
import com.quizplatform.config.AttemptProperties;
import com.quizplatform.quiz.Question;
import com.quizplatform.quiz.QuestionResponse;
import com.quizplatform.quiz.Quiz;
import com.quizplatform.quiz.QuizService;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final QuizService quizService;
    private final AttemptProperties attemptProperties;
    private final Clock clock;

    @Autowired
    public AttemptService(AttemptRepository attemptRepository, UserRepository userRepository, QuizService quizService,
                          AttemptProperties attemptProperties, Clock clock) {
        this.attemptRepository = attemptRepository;
        this.userRepository = userRepository;
        this.quizService = quizService;
        this.attemptProperties = attemptProperties;
        this.clock = clock;
    }

    public AttemptService(AttemptRepository attemptRepository, UserRepository userRepository, QuizService quizService) {
        this(attemptRepository, userRepository, quizService, new AttemptProperties(5), Clock.systemUTC());
    }

    @Transactional
    public AttemptStartResponse start(UUID quizId, UserAccount actor, boolean admin) {
        UserAccount user = userRepository.findByIdForUpdate(actor.getId())
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User account was not found"));
        if (user.isBanned()) {
            throw new ForbiddenException("ACCOUNT_BANNED", "This account is currently suspended");
        }
        quizService.requireVisible(quizId, user.getId(), admin);
        Quiz quiz = quizService.lockForSubmission(quizId);
        List<Question> questions = orderedQuestions(quiz);
        if (questions.isEmpty()) {
            throw new BadRequestException("QUIZ_HAS_NO_QUESTIONS", "This quiz has no questions");
        }
        Instant now = clock.instant();
        List<Attempt> pending = attemptRepository.findPendingForUserAndQuizForUpdate(user.getId(), quizId,
                AttemptStatus.PENDING);
        for (Attempt existing : pending) {
            if (!isExpired(existing, now)) {
                return toStartResponse(existing, questions);
            }
            attemptRepository.delete(existing);
        }
        Attempt attempt = new Attempt(user, quiz, questions.size(), quiz.getTimeLimit(), now);
        attemptRepository.save(attempt);
        return toStartResponse(attempt, questions);
    }

    @Transactional
    public AttemptResponse submit(UUID attemptId, SubmitAttemptRequest request, UserAccount actor, boolean admin) {
        UserAccount user = userRepository.findByIdForUpdate(actor.getId())
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User account was not found"));
        Attempt attempt = attemptRepository.findByIdForUpdate(attemptId)
                .orElseThrow(() -> new NotFoundException("ATTEMPT_NOT_FOUND", "Attempt was not found"));
        if (!attempt.getUser().getId().equals(actor.getId())
                || !user.getId().equals(attempt.getUser().getId())) {
            throw new ForbiddenException("ATTEMPT_OWNERSHIP_REQUIRED", "You can only submit your own attempts");
        }
        if (user.isBanned()) {
            throw new ForbiddenException("ACCOUNT_BANNED", "This account is currently suspended");
        }
        if (!attempt.isPending() || attempt.getCompletedAt() != null) {
            throw new ConflictException("ATTEMPT_ALREADY_COMPLETED", "This attempt has already been completed");
        }
        if (request == null) {
            throw new BadRequestException("SUBMIT_REQUEST_REQUIRED", "A submission request is required");
        }
        if (request.quizId() != null && !request.quizId().equals(attempt.getQuiz().getId())) {
            throw new BadRequestException("QUIZ_MISMATCH", "The attempt does not belong to that quiz");
        }
        Instant now = clock.instant();
        int elapsed = elapsedSeconds(attempt, now);
        if (isBeyondGracePeriod(attempt, elapsed)) {
            throw new ConflictException("ATTEMPT_TIME_EXPIRED", "The attempt time limit has expired");
        }
        if (request.answers() == null) {
            throw new BadRequestException("ANSWERS_REQUIRED", "Answers are required");
        }

        quizService.requireVisible(attempt.getQuiz().getId(), actor.getId(), admin);
        Quiz quiz = quizService.lockForSubmission(attempt.getQuiz().getId());
        List<Question> questions = orderedQuestions(quiz);
        Map<UUID, Question> byId = new HashMap<>();
        questions.forEach(question -> byId.put(question.getId(), question));
        for (UUID submittedQuestionId : request.answers().keySet()) {
            if (!byId.containsKey(submittedQuestionId)) {
                throw new BadRequestException("UNKNOWN_QUESTION", "An answer references a question outside this quiz");
            }
        }
        List<AttemptAnswerData> answerData = new ArrayList<>();
        int correctCount = 0;
        for (Question question : questions) {
            Integer selected = request.answers().get(question.getId());
            if (selected != null && (selected < 0 || selected > 3)) {
                throw new BadRequestException("INVALID_SELECTED_OPTION", "Selected option must be between 0 and 3");
            }
            boolean correct = selected != null && selected == question.getCorrectAnswer();
            if (correct) {
                correctCount++;
            }
            answerData.add(new AttemptAnswerData(question.getId(), selected, question.getCorrectAnswer(), correct));
        }

        LocalDate today = LocalDate.ofInstant(now, ZoneOffset.UTC);
        boolean firstActivityToday = user.getLastActiveDate() == null || !user.getLastActiveDate().equals(today);
        int streak = XpCalculator.nextStreak(user.getLastActiveDate(), user.getStreak(), today);
        boolean eligibleForXp = quiz.getCreatedBy() == null || !quiz.getCreatedBy().getId().equals(user.getId());
        XpBreakdown xp = eligibleForXp
                ? XpCalculator.calculate(quiz.getDifficulty(), correctCount, questions.size(), elapsed,
                attempt.getTimeLimit(), firstActivityToday ? streak : 0)
                : new XpBreakdown(0, 0, 0, 0);
        boolean withinTimeLimit = attempt.getTimeLimit() == null || elapsed <= attempt.getTimeLimit();
        attempt.complete(correctCount, questions.size(), xp.total(), elapsed, withinTimeLimit, xp, answerData, now);
        quiz.incrementAttemptCount();
        attemptRepository.save(attempt);
        if (eligibleForXp) {
            user.recordActivity(today, streak);
            user.addXp(xp.total());
        }
        userRepository.save(user);
        return toResponse(attempt, user.getId(), admin);
    }

    @Transactional
    public AttemptResponse submit(SubmitAttemptRequest request, UserAccount actor, boolean admin) {
        if (request == null || request.quizId() == null) {
            throw new BadRequestException("QUIZ_REQUIRED", "Quiz id is required for the legacy submission endpoint");
        }
        AttemptStartResponse started = start(request.quizId(), actor, admin);
        return submit(started.attemptId(), request, actor, admin);
    }

    @Transactional(readOnly = true)
    public PageResponse<AttemptHistoryResponse> history(UserAccount actor, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), boundedSize(size));
        List<Attempt> attempts = attemptRepository.findHistoryForUser(actor.getId(), pageable);
        long total = attemptRepository.countByUserIdAndCompletedAtIsNotNull(actor.getId());
        Page<Attempt> result = new PageImpl<>(attempts, pageable, total);
        return PageResponse.from(result.map(this::toHistory));
    }

    @Transactional(readOnly = true)
    public PageResponse<AttemptHistoryResponse> adminHistory(int page, int size) {
        return adminHistory("", null, null, null, null, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<AttemptHistoryResponse> adminHistory(String search, UUID userId, UUID quizId,
                                                               Instant from, Instant to, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), boundedSize(size));
        org.springframework.data.jpa.domain.Specification<Attempt> specification =
                (root, query, criteriaBuilder) -> {
                    var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
                    predicates.add(criteriaBuilder.isNotNull(root.get("completedAt")));
                    if (search != null && !search.isBlank()) {
                        String pattern = "%" + search.trim().toLowerCase(java.util.Locale.ROOT) + "%";
                        var user = root.join("user");
                        var quiz = root.join("quiz");
                        predicates.add(criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(user.get("username")), pattern),
                                criteriaBuilder.like(criteriaBuilder.lower(user.get("email")), pattern),
                                criteriaBuilder.like(criteriaBuilder.lower(quiz.get("title")), pattern)));
                    }
                    if (userId != null) {
                        predicates.add(criteriaBuilder.equal(root.get("user").get("id"), userId));
                    }
                    if (quizId != null) {
                        predicates.add(criteriaBuilder.equal(root.get("quiz").get("id"), quizId));
                    }
                    if (from != null) {
                        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("completedAt"), from));
                    }
                    if (to != null) {
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("completedAt"), to));
                    }
                    return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
                };
        Page<Attempt> result = attemptRepository.findAll(specification, pageable);
        return PageResponse.from(result.map(this::toHistory));
    }

    @Transactional(readOnly = true)
    public AttemptHistoryResponse get(UUID attemptId, UserAccount actor, boolean admin) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("ATTEMPT_NOT_FOUND", "Attempt was not found"));
        if (!admin && !attempt.getUser().getId().equals(actor.getId())) {
            throw new ForbiddenException("ATTEMPT_OWNERSHIP_REQUIRED", "You can only view your own attempts");
        }
        return toHistory(attempt);
    }

    @Transactional(readOnly = true)
    public AccuracyResponse accuracy(UserAccount actor) {
        long correct = attemptRepository.sumScoreForUser(actor.getId());
        long total = attemptRepository.sumQuestionsForUser(actor.getId());
        double percentage = total == 0 ? 0 : Math.round((correct * 1000.0 / total)) / 10.0;
        return new AccuracyResponse((int) correct, (int) total, percentage);
    }

    private AttemptStartResponse toStartResponse(Attempt attempt, List<Question> questions) {
        Instant expiresAt = attempt.getTimeLimit() == null ? null
                : attempt.getStartedAt().plusSeconds(attempt.getTimeLimit() + gracePeriodSeconds());
        return new AttemptStartResponse(attempt.getId(), attempt.getQuiz().getId(), attempt.getStatus().name(),
                attempt.getStartedAt(), expiresAt, attempt.getTimeLimit(), gracePeriodSeconds(),
                questions.stream().map(question -> QuestionResponse.from(question, false)).toList());
    }

    private AttemptResponse toResponse(Attempt attempt, UUID viewerId, boolean admin) {
        List<AttemptAnswerResponse> answers = answerResponses(attempt);
        XpBreakdown xp = new XpBreakdown(attempt.getBaseXp(), attempt.getTimeBonusXp(), attempt.getStreakBonusXp(),
                attempt.getXpEarned());
        return new AttemptResponse(attempt.getId(), attempt.getQuiz().getId(), attempt.getStatus().name(), attempt.getScore(),
                attempt.getTotalQuestions(), attempt.getXpEarned(), attempt.getBaseXp(), attempt.getTimeBonusXp(),
                attempt.getStreakBonusXp(), attempt.getTimeTaken(), attempt.getTimeLimit(),
                attempt.isCompletedWithinTimeLimit(), attempt.getStartedAt(), attempt.getCompletedAt(), xp, answers,
                quizService.summary(attempt.getQuiz(), viewerId, admin));
    }

    private AttemptHistoryResponse toHistory(Attempt attempt) {
        return new AttemptHistoryResponse(attempt.getId(), attempt.getUser().getId(), attempt.getQuiz().getId(),
                attempt.getStatus().name(), attempt.getScore(), attempt.getTotalQuestions(), attempt.getXpEarned(),
                attempt.getBaseXp(), attempt.getTimeBonusXp(), attempt.getStreakBonusXp(), attempt.getTimeTaken(),
                attempt.getTimeLimit(), attempt.isCompletedWithinTimeLimit(), attempt.getStartedAt(),
                attempt.getCompletedAt(), answerResponses(attempt),
                quizService.summary(attempt.getQuiz(), attempt.getUser().getId(), false),
                new XpBreakdown(attempt.getBaseXp(), attempt.getTimeBonusXp(), attempt.getStreakBonusXp(),
                        attempt.getXpEarned()));
    }

    private List<AttemptAnswerResponse> answerResponses(Attempt attempt) {
        Map<UUID, Question> questions = new HashMap<>();
        attempt.getQuiz().getQuestions().forEach(question -> questions.put(question.getId(), question));
        return attempt.getAnswers().stream().map(answer -> {
            Question question = questions.get(answer.getQuestionId());
            return new AttemptAnswerResponse(answer.getQuestionId(), answer.getSelected(), answer.getCorrectAnswer(),
                    answer.isCorrect(), question == null ? null : question.getText(),
                    question == null ? List.of() : question.getOptions(),
                    question == null ? null : question.getExplanation());
        }).toList();
    }

    private List<Question> orderedQuestions(Quiz quiz) {
        return quiz.getQuestions().stream().sorted(java.util.Comparator.comparingInt(Question::getQuestionOrder)).toList();
    }

    private int elapsedSeconds(Attempt attempt, Instant now) {
        if (attempt.getStartedAt() == null) {
            return 0;
        }
        long seconds = Math.max(0, Duration.between(attempt.getStartedAt(), now).getSeconds());
        return (int) Math.min(seconds, Integer.MAX_VALUE);
    }

    private boolean isBeyondGracePeriod(Attempt attempt, int elapsed) {
        return attempt.getTimeLimit() != null
                && (long) elapsed > (long) attempt.getTimeLimit() + gracePeriodSeconds();
    }

    private boolean isExpired(Attempt attempt, Instant now) {
        return isBeyondGracePeriod(attempt, elapsedSeconds(attempt, now));
    }

    private long gracePeriodSeconds() {
        return Math.max(0, attemptProperties.gracePeriodSeconds());
    }

    private int boundedSize(int size) {
        if (size < 1 || size > 100) {
            throw new BadRequestException("INVALID_PAGE_SIZE", "Page size must be between 1 and 100");
        }
        return size;
    }
}
