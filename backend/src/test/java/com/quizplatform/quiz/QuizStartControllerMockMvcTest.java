package com.quizplatform.quiz;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.quizplatform.attempt.AttemptService;
import com.quizplatform.attempt.AttemptStartResponse;
import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.common.GlobalExceptionHandler;
import com.quizplatform.user.UserAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class QuizStartControllerMockMvcTest {

    private MockMvc mockMvc;
    private UUID quizId;
    private UUID questionId;
    private UUID attemptId;

    @BeforeEach
    void setUp() {
        quizId = UUID.randomUUID();
        questionId = UUID.randomUUID();
        attemptId = UUID.randomUUID();
        CapturingAttemptService attemptService = new CapturingAttemptService();
        QuizService quizService = new StubQuizService();
        CurrentUserService currentUserService = new FixedCurrentUserService();
        ObjectMapper objectMapper = new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(new QuizController(quizService, currentUserService, attemptService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void startReturnsSanitizedQuestions() throws Exception {
        mockMvc.perform(post("/api/quizzes/{id}/start", quizId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attempt_id").value(attemptId.toString()))
                .andExpect(jsonPath("$.questions[0].question_text").value("Private question"))
                .andExpect(jsonPath("$.questions[0].correct_answer").doesNotExist())
                .andExpect(jsonPath("$.questions[0].explanation").doesNotExist());
    }

    private final class CapturingAttemptService extends AttemptService {
        private CapturingAttemptService() {
            super(null, null, null);
        }

        @Override
        public AttemptStartResponse start(UUID requestedQuizId, UserAccount actor, boolean admin) {
            QuestionResponse question = new QuestionResponse(questionId, quizId, "Private question",
                    List.of("A", "B", "C", "D"), null, null, 0);
            return new AttemptStartResponse(attemptId, quizId, "PENDING", Instant.now(), null, 60, 5,
                    List.of(question));
        }
    }

    private static final class StubQuizService extends QuizService {
        private StubQuizService() {
            super(null, null, null, null);
        }
    }

    private static final class FixedCurrentUserService extends CurrentUserService {
        private FixedCurrentUserService() {
            super(null);
        }

        @Override
        public UserAccount activeAccount() {
            return new UserAccount(UUID.randomUUID(), "user@example.com", "hash", "quiz-user");
        }

        @Override
        public UUID id() {
            return activeAccount().getId();
        }
    }
}
