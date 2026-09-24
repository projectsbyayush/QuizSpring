package com.quizplatform.quiz;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizRepository extends JpaRepository<Quiz, UUID>, JpaSpecificationExecutor<Quiz> {
    @Query("select distinct q from Quiz q left join fetch q.category left join fetch q.createdBy left join fetch q.questions where q.id = :id")
    Optional<Quiz> findWithDetailsById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select q from Quiz q where q.id = :id")
    Optional<Quiz> findByIdForUpdate(@Param("id") UUID id);

    Optional<Quiz> findByIdAndCreatedById(UUID id, UUID createdById);

    long countByCreatedById(UUID createdById);

    long countByCategoryId(UUID categoryId);

    long countByPublishedTrue();

    @EntityGraph(attributePaths = {"category", "createdBy"})
    List<Quiz> findTop100ByPublishedTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"category", "createdBy"})
    @Query("select q from Quiz q where q.published = true and (q.createdBy is null or q.createdBy.id <> :viewerId) and q.category.id in :categoryIds order by q.createdAt desc")
    List<Quiz> findRecommendedByCategories(@Param("viewerId") UUID viewerId,
                                           @Param("categoryIds") Collection<UUID> categoryIds,
                                           Pageable pageable);

    @EntityGraph(attributePaths = {"category", "createdBy"})
    @Query("select q from Quiz q where q.published = true and (q.createdBy is null or q.createdBy.id <> :viewerId) and q.difficulty in :difficulties order by q.createdAt desc")
    List<Quiz> findRecommendedByDifficulties(@Param("viewerId") UUID viewerId,
                                            @Param("difficulties") Collection<com.quizplatform.quiz.Difficulty> difficulties,
                                            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "createdBy"})
    List<Quiz> findTop6ByPublishedTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"category", "createdBy"})
    List<Quiz> findTop5ByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"category", "createdBy"})
    List<Quiz> findTop6ByPublishedTrueAndCategoryIdInOrderByCreatedAtDesc(java.util.Collection<UUID> categoryIds);
}
