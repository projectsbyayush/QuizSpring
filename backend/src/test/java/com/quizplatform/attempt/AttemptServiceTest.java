package com.quizplatform.attempt;

import com.quizplatform.common.ConflictException;
import com.quizplatform.common.ForbiddenException;
import com.quizplatform.config.AttemptProperties;
import com.quizplatform.quiz.Difficulty;
import com.quizplatform.quiz.Question;
import com.quizplatform.quiz.Quiz;
import com.quizplatform.quiz.QuizService;
import com.quizplatform.quiz.QuizSummaryResponse;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AttemptServiceTest {

    private final UUID userId = UUID.randomUUID();
    private final UUID otherUserId = UUID.randomUUID();
    private final UUID quizId = UUID.randomUUID();
    private final UUID questionId = UUID.randomUUID();
    private final Instant startedAt = Instant.parse("2026-09-24T12:00:00Z");
    private AttemptRepository attemptRepository;
    private UserRepository userRepository;
    private QuizService quizService;
    private Quiz quiz;
    private UserAccount user;
    private AtomicReference<Attempt> lockedAttempt;
    private AtomicInteger savedAttempts;
    private AttemptService attemptService;

    @BeforeEach
    void setUp() {
        user = new UserAccount(userId, "user@example.com", "hash", "quiz-user");
        quiz = new Quiz("Server quiz", null, null, user, Difficulty.EASY, 10, true);
        ReflectionTestUtils.setField(quiz, "id", quizId);
        Question question = new Question("Question", List.of("A", "B", "C", "D"), 0, null, 0);
        ReflectionTestUtils.setField(question, "id", questionId);
        quiz.addQuestion(question);
        quizService = new StubQuizService(quiz);
        lockedAttempt = new AtomicReference<>();
        savedAttempts = new AtomicInteger();
        attemptRepository = (AttemptRepository) Proxy.newProxyInstance(
                AttemptRepository.class.getClassLoader(), new Class<?>[]{AttemptRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findByIdForUpdate")) {
                        return Optional.ofNullable(lockedAttempt.get());
                    }
                    if (method.getName().equals("save")) {
                        savedAttempts.incrementAndGet();
                        return args[0];
                    }
                    if (method.getName().equals("findPendingForUserAndQuizForUpdate")) {
                        return List.of();
                    }
                    return defaultValue(method.getReturnType());
                });
        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findById") || method.getName().equals("findByIdForUpdate")) {
                        return Optional.of(user);
                    }
                    return defaultValue(method.getReturnType());
                });
        attemptService = new AttemptService(attemptRepository, userRepository, quizService,
                new AttemptProperties(5), Clock.fixed(startedAt.plusSeconds(3), ZoneOffset.UTC));
    }

    @Test
    void submitUsesServerElapsedTimeInsteadOfClientTime() {
        Attempt attempt = pendingAttempt();
        lockedAttempt.set(attempt);

        AttemptResponse response = attemptService.submit(attempt.getId(),
                new SubmitAttemptRequest(null, Map.of(questionId, 0), 0), user, false);

        assertEquals(3, response.timeTaken());
        assertEquals(1, response.score());
        assertEquals(0, response.xpEarned());
        assertEquals(1, attempt.getAnswerRows().size());
        assertEquals(0, attempt.getAnswerRows().get(0).getSelectedOption());
        assertEquals(0, attempt.getAnswerRows().get(0).getCorrectOption());
        assertEquals(1, savedAttempts.get());
    }

    @Test
    void submitRejectsAnAttemptAfterTheGracePeriod() {
        Attempt attempt = pendingAttempt();
        lockedAttempt.set(attempt);
        attemptService = new AttemptService(attemptRepository, userRepository, quizService,
                new AttemptProperties(5), Clock.fixed(startedAt.plusSeconds(16), ZoneOffset.UTC));

        assertThrows(ConflictException.class, () -> attemptService.submit(attempt.getId(),
                new SubmitAttemptRequest(null, Map.of(questionId, 0), 0), user, false));
        assertEquals(0, savedAttempts.get());
    }

    @Test
    void submitRejectsAnotherUsersAttempt() {
        Attempt attempt = pendingAttempt();
        lockedAttempt.set(attempt);
        UserAccount other = new UserAccount(otherUserId, "other@example.com", "hash", "other-user");

        assertThrows(ForbiddenException.class, () -> attemptService.submit(attempt.getId(),
                new SubmitAttemptRequest(null, Map.of(), 0), other, false));
    }

    @Test
    void submitRejectsACompletedAttempt() {
        Attempt attempt = new Attempt(user, quiz, 1, 1, 10, 3,
                List.of(new AttemptAnswerData(questionId, 0, 0, true)));
        setId(attempt, UUID.randomUUID());
        lockedAttempt.set(attempt);

        assertThrows(ConflictException.class, () -> attemptService.submit(attempt.getId(),
                new SubmitAttemptRequest(null, Map.of(), 0), user, false));
    }

    private Attempt pendingAttempt() {
        Attempt attempt = new Attempt(user, quiz, 1, 10, startedAt);
        setId(attempt, UUID.randomUUID());
        return attempt;
    }

    private void setId(Attempt attempt, UUID id) {
        ReflectionTestUtils.setField(attempt, "id", id);
    }

    private static Object defaultValue(Class<?> type) {
        if (!type.isPrimitive()) {
            return null;
        }
        if (type == boolean.class) {
            return false;
        }
        if (type == byte.class) {
            return (byte) 0;
        }
        if (type == short.class) {
            return (short) 0;
        }
        if (type == int.class) {
            return 0;
        }
        if (type == long.class) {
            return 0L;
        }
        if (type == float.class) {
            return 0F;
        }
        if (type == double.class) {
            return 0D;
        }
        if (type == char.class) {
            return '\0';
        }
        return null;
    }

    private static final class StubQuizService extends QuizService {
        private final Quiz quiz;

        private StubQuizService(Quiz quiz) {
            super(null, null, null, null);
            this.quiz = quiz;
        }

        @Override
        public Quiz requireVisible(UUID id, UUID viewerId, boolean admin) {
            return quiz;
        }

        @Override
        public Quiz lockForSubmission(UUID id) {
            return quiz;
        }

        @Override
        public QuizSummaryResponse summary(Quiz value, UUID viewerId, boolean admin) {
            return null;
        }
    }
}
