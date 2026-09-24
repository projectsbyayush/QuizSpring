package com.quizplatform.dashboard;

import com.quizplatform.attempt.Attempt;
import com.quizplatform.attempt.AttemptHistoryResponse;
import com.quizplatform.attempt.AttemptRepository;
import com.quizplatform.auth.CurrentUserService;
import com.quizplatform.quiz.Quiz;
import com.quizplatform.quiz.QuizRepository;
import com.quizplatform.quiz.QuizService;
import com.quizplatform.quiz.QuizSummaryResponse;
import com.quizplatform.user.UserAccount;
import com.quizplatform.user.UserResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardService {

    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final QuizService quizService;
    private final CurrentUserService currentUserService;

    public DashboardService(AttemptRepository attemptRepository, QuizRepository quizRepository, QuizService quizService,
                            CurrentUserService currentUserService) {
        this.attemptRepository = attemptRepository;
        this.quizRepository = quizRepository;
        this.quizService = quizService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse get() {
        UserAccount user = currentUserService.activeAccount();
        long correct = attemptRepository.sumScoreForUser(user.getId());
        long totalQuestions = attemptRepository.sumQuestionsForUser(user.getId());
        double accuracy = totalQuestions == 0 ? 0 : Math.round(correct * 1000.0 / totalQuestions) / 10.0;
        DashboardStatsResponse stats = new DashboardStatsResponse(attemptRepository.countByUserIdAndCompletedAtIsNotNull(user.getId()),
                user.getTotalXp(), user.getLevel(), accuracy, quizRepository.countByCreatedById(user.getId()), user.getStreak(),
                user.getCurrentStreak(), user.getLongestStreak());
        List<Attempt> recentAttempts = attemptRepository.findHistoryForUser(user.getId(), PageRequest.of(0, 6));
        List<AttemptHistoryResponse> recent = recentAttempts.stream()
                .map(attempt -> new AttemptHistoryResponse(attempt.getId(), attempt.getUser().getId(),
                        attempt.getQuiz().getId(), attempt.getStatus().name(), attempt.getScore(), attempt.getTotalQuestions(),
                        attempt.getXpEarned(), attempt.getBaseXp(), attempt.getTimeBonusXp(), attempt.getStreakBonusXp(),
                        attempt.getTimeTaken(), attempt.getTimeLimit(), attempt.isCompletedWithinTimeLimit(),
                        attempt.getStartedAt(), attempt.getCompletedAt(), attempt.getAnswers().stream()
                        .map(com.quizplatform.attempt.AttemptAnswerResponse::from).toList(),
                        quizService.summary(attempt.getQuiz(), user.getId(), false),
                        new com.quizplatform.attempt.XpBreakdown(attempt.getBaseXp(), attempt.getTimeBonusXp(),
                                attempt.getStreakBonusXp(), attempt.getXpEarned())))
                .toList();
        List<QuizSummaryResponse> recommended = quizService.recommended(user.getId());
        return new DashboardResponse(stats, UserResponse.from(user), recent, recommended);
    }

    private List<UUID> favoriteCategoryIds(List<Attempt> attempts) {
        Map<UUID, Integer> counts = new LinkedHashMap<>();
        for (Attempt attempt : attempts) {
            if (attempt.getQuiz().getCategory() != null) {
                UUID categoryId = attempt.getQuiz().getCategory().getId();
                counts.merge(categoryId, 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<UUID, Integer>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();
    }
}
