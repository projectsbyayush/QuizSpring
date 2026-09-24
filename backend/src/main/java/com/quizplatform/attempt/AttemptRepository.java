package com.quizplatform.attempt;

import com.quizplatform.quiz.Difficulty;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttemptRepository extends JpaRepository<Attempt, UUID>, JpaSpecificationExecutor<Attempt> {
    @Query("select a from Attempt a join fetch a.quiz q left join fetch q.category where a.user.id = :userId and a.completedAt is not null order by a.completedAt desc")
    List<Attempt> findHistoryForUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("select a from Attempt a join fetch a.user u join fetch a.quiz q left join fetch q.category where a.completedAt is not null order by a.completedAt desc")
    List<Attempt> findAdminHistory(Pageable pageable);

    Optional<Attempt> findByIdAndUserId(UUID id, UUID userId);

    List<Attempt> findByQuizId(UUID quizId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Attempt a where a.id = :id")
    Optional<Attempt> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Attempt a where a.user.id = :userId and a.quiz.id = :quizId and a.status = :status order by a.startedAt desc")
    List<Attempt> findPendingForUserAndQuizForUpdate(@Param("userId") UUID userId, @Param("quizId") UUID quizId,
                                                    @Param("status") AttemptStatus status);

    long countByUserId(UUID userId);

    long countByUserIdAndCompletedAtIsNotNull(UUID userId);

    long countByQuizId(UUID quizId);

    long countByQuizIdAndCompletedAtIsNotNull(UUID quizId);

    long countByCompletedAtIsNotNull();

    @Query("select coalesce(sum(a.score), 0) from Attempt a where a.user.id = :userId and a.completedAt is not null")
    long sumScoreForUser(@Param("userId") UUID userId);

    @Query("select coalesce(sum(a.totalQuestions), 0) from Attempt a where a.user.id = :userId and a.completedAt is not null")
    long sumQuestionsForUser(@Param("userId") UUID userId);

    @Query("select coalesce(sum(a.xpEarned), 0) from Attempt a where a.user.id = :userId and a.completedAt is not null")
    long sumXpForUser(@Param("userId") UUID userId);

    @Query("select distinct q.category.id from Attempt a join a.quiz q where a.user.id = :userId and a.completedAt is not null and q.category is not null")
    List<UUID> findAttemptedCategoryIds(@Param("userId") UUID userId);

    @Query("select distinct q.difficulty from Attempt a join a.quiz q where a.user.id = :userId and a.completedAt is not null")
    List<Difficulty> findAttemptedDifficulties(@Param("userId") UUID userId);

    long countByCompletedAtAfter(Instant instant);

    @Query("select a from Attempt a where a.completedAt is not null order by a.completedAt desc")
    List<Attempt> findTop5ByCompletedAtIsNotNullOrderByCompletedAtDesc();
}
