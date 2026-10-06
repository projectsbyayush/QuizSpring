package com.quizplatform.quiz;

import com.quizplatform.category.Category;
import com.quizplatform.category.CategoryRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Seeds the platform-provided quiz catalogue. Each quiz is assembled from the
 * curated question bank in {@link QuestionBank}, sampling a handful of
 * questions per quiz so no single quiz repeats itself. Runs only when the
 * catalogue is empty, so restarts stay cheap.
 */
@Component
@Order(50)
public class OfficialQuizSeeder implements ApplicationRunner {

    private static final int QUESTIONS_PER_QUIZ = 5;
    private static final long RANDOM_SEED = 20260906L;

    private final CategoryRepository categoryRepository;
    private final QuizRepository quizRepository;

    public OfficialQuizSeeder(CategoryRepository categoryRepository, QuizRepository quizRepository) {
        this.categoryRepository = categoryRepository;
        this.quizRepository = quizRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (quizRepository.countByOfficialTrue() > 0) {
            return;
        }
        List<QuestionBank.Quiz> plans = QuestionBank.plans();
        if (plans.isEmpty()) {
            return;
        }
        Map<String, Category> categories = new LinkedHashMap<>();
        int created = 0;
        for (QuestionBank.Quiz plan : plans) {
            Category category = categories.computeIfAbsent(plan.categorySlug(),
                    slug -> categoryRepository.findBySlug(slug).orElse(null));
            Quiz quiz = buildQuiz(plan, category);
            quiz.setOfficial(true);
            quizRepository.save(quiz);
            created++;
        }
        System.out.println("[QuizSpring] Seeded " + created + " official quizzes across "
                + categories.size() + " collections");
    }

    private Quiz buildQuiz(QuestionBank.Quiz plan, Category category) {
        List<QuestionBank.Entry> pool = new ArrayList<>(plan.entries());
        Collections.shuffle(pool, new Random(RANDOM_SEED + plan.title().hashCode()));
        int take = Math.min(QUESTIONS_PER_QUIZ, pool.size());
        Quiz quiz = new Quiz(plan.title(), plan.descriptionFor(), category, null,
                plan.difficulty(), plan.timeLimitSeconds(), true);
        for (int index = 0; index < take; index++) {
            QuestionBank.Entry entry = pool.get(index);
            quiz.addQuestion(new Question(entry.text(), entry.options(), entry.correctIndex(),
                    entry.explanation(), index));
        }
        return quiz;
    }
}
