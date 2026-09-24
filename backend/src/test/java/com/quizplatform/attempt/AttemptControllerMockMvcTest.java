package com.quizplatform.attempt;

import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.common.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.quizplatform.user.UserAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AttemptControllerMockMvcTest {

    private CapturingAttemptService attemptService;
    private FixedCurrentUserService currentUserService;
    private MockMvc mockMvc;
    private UserAccount actor;

    @BeforeEach
    void setUp() {
        attemptService = new CapturingAttemptService();
        currentUserService = new FixedCurrentUserService();
        actor = new UserAccount(UUID.randomUUID(), "user@example.com", "hash", "quiz-user");
        ObjectMapper objectMapper = new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        mockMvc = MockMvcBuilders.standaloneSetup(new AttemptController(attemptService, currentUserService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void submitAcceptsOnlySelectedOptionsAndReturnsServerResult() throws Exception {
        UUID quizId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        attemptService.quizId = quizId;
        attemptService.questionId = questionId;

        mockMvc.perform(post("/api/v1/attempts")
                        .contentType("application/json")
                        .content("{\"quiz_id\":\"" + quizId + "\",\"answers\":{\"" + questionId + "\":0},\"time_taken\":5}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.score").value(1))
                .andExpect(jsonPath("$.answers[0].correct").value(true));

        assertEquals(Map.of(questionId, 0), attemptService.request.answers());
    }

    @Test
    void submitUsesAttemptIdAndDoesNotExposeLegacyQuizIdRequirement() throws Exception {
        UUID attemptId = UUID.randomUUID();
        UUID quizId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        attemptService.quizId = quizId;
        attemptService.questionId = questionId;
        attemptService.attemptId = attemptId;

        mockMvc.perform(post("/api/attempts/{id}/submit", attemptId)
                        .contentType("application/json")
                        .content("{\"answers\":{\"" + questionId + "\":0},\"time_taken\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempt_id").value(attemptId.toString()));

        assertEquals(attemptId, attemptService.submittedAttemptId);
        assertEquals(Map.of(questionId, 0), attemptService.request.answers());
    }

    private static final class CapturingAttemptService extends AttemptService {
        private UUID quizId;
        private UUID questionId;
        private UUID attemptId;
        private UUID submittedAttemptId;
        private SubmitAttemptRequest request;

        private CapturingAttemptService() {
            super(null, null, null);
        }

        @Override
        public AttemptResponse submit(UUID attemptId, SubmitAttemptRequest request, UserAccount actor, boolean admin) {
            this.submittedAttemptId = attemptId;
            this.request = request;
            UUID resultId = this.attemptId == null ? UUID.randomUUID() : this.attemptId;
            return new AttemptResponse(resultId, quizId, "COMPLETED", 1, 1, 10, 10, 0, 0, 5, null,
                    true, null, null, new XpBreakdown(10, 0, 0, 10),
                    java.util.List.of(new AttemptAnswerResponse(questionId, 0, true)), null);
        }

        @Override
        public AttemptResponse submit(SubmitAttemptRequest request, UserAccount actor, boolean admin) {
            this.request = request;
            return new AttemptResponse(UUID.randomUUID(), quizId, 1, 1, 10, 5, null,
                    new XpBreakdown(10, 0, 0, 10),
                    java.util.List.of(new AttemptAnswerResponse(questionId, 0, true)), null);
        }
    }

    private static final class FixedCurrentUserService extends CurrentUserService {
        private final UserAccount user = new UserAccount(UUID.randomUUID(), "user@example.com", "hash", "quiz-user");

        private FixedCurrentUserService() {
            super(null);
        }

        @Override
        public UserAccount activeAccount() {
            return user;
        }

        @Override
        public boolean isAdmin() {
            return false;
        }
    }
}
