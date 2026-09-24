package com.quizplatform.quiz;

import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;
import java.util.UUID;

public final class QuizSpecifications {

    private QuizSpecifications() {
    }

    public static Specification<Quiz> ownedBy(UUID viewerId) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("createdBy").get("id"), viewerId);
    }

    public static Specification<Quiz> searchable(String search, UUID categoryId, Difficulty difficulty,
                                                   UUID viewerId, boolean admin, boolean includeDrafts) {
        return searchable(search, categoryId, difficulty, viewerId, admin, includeDrafts, null);
    }

    public static Specification<Quiz> searchable(String search, UUID categoryId, Difficulty difficulty,
                                                   UUID viewerId, boolean admin, boolean includeDrafts,
                                                   Boolean published) {
        return (root, query, criteriaBuilder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (!admin) {
                if (includeDrafts && viewerId != null) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.isTrue(root.get("published")),
                            criteriaBuilder.equal(root.join("createdBy").get("id"), viewerId)));
                } else {
                    predicates.add(criteriaBuilder.isTrue(root.get("published")));
                }
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("description"), "")), pattern)));
            }
            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }
            if (difficulty != null) {
                predicates.add(criteriaBuilder.equal(root.get("difficulty"), difficulty));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("published"), published));
            }
            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
