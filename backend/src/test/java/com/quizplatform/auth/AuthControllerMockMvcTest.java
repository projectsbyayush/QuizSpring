package com.quizplatform.auth;

import com.quizplatform.common.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerMockMvcTest {

    private CapturingAuthService authService;
    private FixedPasswordResetService passwordResetService;
    private FixedCurrentUserService currentUserService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = new CapturingAuthService();
        passwordResetService = new FixedPasswordResetService();
        currentUserService = new FixedCurrentUserService();
        ObjectMapper objectMapper = new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService, passwordResetService, currentUserService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void registerReturnsTokenPairAndUser() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType("application/json")
                        .content("""
                                {"email":"user@example.com","username":"quiz-user","password":"password123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access_token").value("access"))
                .andExpect(jsonPath("$.refresh_token").value("refresh"))
                .andExpect(jsonPath("$.user.email").value("user@example.com"));
    }

    @Test
    void signupAliasUsesTheSameRegistrationContract() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType("application/json")
                        .content("""
                                {"email":"user@example.com","username":"quiz-user","password":"password123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access_token").value("access"));
    }

    @Test
    void forgotPasswordDoesNotRevealWhetherAccountExists() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType("application/json")
                        .content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists for that email, a reset link has been sent."));
    }

    private static final class CapturingAuthService extends AuthService {
        private final UserAccount user = new UserAccount(UUID.randomUUID(), "user@example.com", "hash", "quiz-user");

        private CapturingAuthService() {
            super(null, null, null, null, null);
        }

        @Override
        public AuthResponse register(RegisterRequest request, RequestMetadata metadata) {
            return new AuthResponse("access", "refresh", "Bearer", 900, UserResponse.from(user));
        }
    }

    private static final class FixedPasswordResetService extends PasswordResetService {
        private FixedPasswordResetService() {
            super(null, null, null, null, null, null);
        }

        @Override
        public PasswordResetResponse requestReset(ForgotPasswordRequest request) {
            return PasswordResetResponse.sent();
        }
    }

    private static final class FixedCurrentUserService extends CurrentUserService {
        private FixedCurrentUserService() {
            super(null);
        }
    }
}
