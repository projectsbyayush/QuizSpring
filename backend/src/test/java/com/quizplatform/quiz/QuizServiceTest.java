package com.quizplatform.quiz;

import com.quizplatform.attempt.Attempt;
import com.quizplatform.attempt.AttemptAnswerData;
import com.quizplatform.attempt.AttemptRepository;
import com.quizplatform.common.ConflictException;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QuizServiceTest {

    private final UUID ownerId = UUID.randomUUID();
    private final UUID playerId = UUID.randomUUID();
    private final UUID quizId = UUID.randomUUID();
    private final UUID questionId = UUID.randomUUID();

    private UserAccount owner;
    private UserAccount player;
    private Quiz quiz;
    private Attempt attempt;
    private AtomicReference<Object> deletedQuiz;
    private AtomicReference<Object> deletedAttempts;
    private AtomicReference<Object> savedUser;
    private QuizService quizService;

    @BeforeEach
    void setUp() {
        owner = new UserAccount(ownerId, "owner@example.com", "hash", "quiz-owner");
        player = new UserAccount(playerId, "player@example.com", "hash", "quiz-player");
        player.addXp(17);
        quiz = new Quiz("Deletable quiz", null, null, owner, Difficulty.EASY, 300, true);
        ReflectionTestUtils.setField(quiz, "id", quizId);
        attempt = new Attempt(player, quiz, 1, 1, 17, 60,
                List.of(new AttemptAnswerData(questionId, 0, 0, true)));
        ReflectionTestUtils.setField(attempt, "id", UUID.randomUUID());
        deletedQuiz = new AtomicReference<>();
        deletedAttempts = new AtomicReference<>();
        savedUser = new AtomicReference<>();

        QuizRepository quizRepository = (QuizRepository) Proxy.newProxyInstance(
                QuizRepository.class.getClassLoader(), new Class<?>[]{QuizRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findByIdForUpdate")) {
                        return Optional.of(quiz);
                    }
                    if (method.getName().equals("delete")) {
                        deletedQuiz.set(args[0]);
                        return null;
                    }
                    return defaultValue(method.getReturnType());
                });
        AttemptRepository attemptRepository = (AttemptRepository) Proxy.newProxyInstance(
                AttemptRepository.class.getClassLoader(), new Class<?>[]{AttemptRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findByQuizId")) {
                        return List.of(attempt);
                    }
                    if (method.getName().equals("countByQuizId")) {
                        return 1L;
                    }
                    if (method.getName().equals("deleteAll")) {
                        deletedAttempts.set(args[0]);
                        return null;
                    }
                    return defaultValue(method.getReturnType());
                });
        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("save")) {
                        savedUser.set(args[0]);
                        return args[0];
                    }
                    return defaultValue(method.getReturnType());
                });
        quizService = new QuizService(quizRepository, attemptRepository, null, userRepository);
    }

    @Test
    void deleteRemovesAttemptsAndRevokesEarnedXp() {
        quizService.delete(quizId, owner, false);

        assertEquals(quiz, deletedQuiz.get());
        assertTrue(((Iterable<?>) deletedAttempts.get()).iterator().hasNext());
        assertEquals(0, player.getTotalXp());
        assertEquals(1, player.getLevel());
        assertEquals(player, savedUser.get());
    }

    @Test
    void updateRemainsBlockedWhenAttemptsExist() {
        assertThrows(ConflictException.class, () -> quizService.update(quizId,
                new QuizUpdateRequest(null, null, null, null, null, null, null), owner, false));
    }

    private static Object defaultValue(Class<?> type) {
        if (!type.isPrimitive()) {
            return null;
        }
        if (type == boolean.class) {
            return false;
        }
        if (type == long.class) {
            return 0L;
        }
        if (type == int.class) {
            return 0;
        }
        return null;
    }
}
