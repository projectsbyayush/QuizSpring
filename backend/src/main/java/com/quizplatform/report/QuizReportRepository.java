package com.quizplatform.report;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizReportRepository extends JpaRepository<QuizReport, UUID> {

    boolean existsByQuizIdAndReporterIdAndStatus(UUID quizId, UUID reporterId, String status);

    long countByStatus(String status);

    @Query("select r from QuizReport r join fetch r.quiz q left join fetch q.category left join fetch q.createdBy "
            + "join fetch r.reporter where r.status = :status or :status is null order by r.createdAt desc")
    Page<QuizReport> findAdminPage(@Param("status") String status, Pageable pageable);

    @Query("select r from QuizReport r join fetch r.quiz q left join fetch q.category left join fetch q.createdBy "
            + "join fetch r.reporter left join fetch r.resolvedBy where r.id = :id")
    Optional<QuizReport> findWithDetails(@Param("id") UUID id);

    List<QuizReport> findByStatus(String status);
}
