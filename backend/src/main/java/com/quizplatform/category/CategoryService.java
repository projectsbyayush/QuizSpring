package com.quizplatform.category;

import com.quizplatform.common.ConflictException;
import com.quizplatform.common.NotFoundException;
import com.quizplatform.quiz.QuizRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final QuizRepository quizRepository;

    public CategoryService(CategoryRepository categoryRepository, QuizRepository quizRepository) {
        this.categoryRepository = categoryRepository;
        this.quizRepository = quizRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categoryRepository.findAll().stream()
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = request.name().trim();
        String slug = slugify(name);
        if (categoryRepository.existsByNameIgnoreCase(name) || categoryRepository.existsBySlug(slug)) {
            throw new ConflictException("CATEGORY_EXISTS", "A category with that name or slug already exists");
        }
        Category category = new Category(name, slug);
        category.update(name, slug, trimToNull(request.description()), trimToNull(request.icon()));
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest request) {
        Category category = find(id);
        String name = request.name().trim();
        String slug = slugify(name);
        if ((categoryRepository.existsByNameIgnoreCase(name) && !category.getName().equalsIgnoreCase(name))
                || (categoryRepository.existsBySlug(slug) && !category.getSlug().equals(slug))) {
            throw new ConflictException("CATEGORY_EXISTS", "A category with that name or slug already exists");
        }
        category.update(name, slug, trimToNull(request.description()), trimToNull(request.icon()));
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(UUID id) {
        Category category = find(id);
        if (quizRepository.countByCategoryId(id) > 0) {
            throw new ConflictException("CATEGORY_IN_USE", "Quizzes must be recategorized before deleting this category");
        }
        try {
            categoryRepository.delete(category);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("CATEGORY_IN_USE", "Quizzes must be recategorized before deleting this category");
        }
    }

    @Transactional(readOnly = true)
    public Category require(UUID id) {
        return find(id);
    }

    private Category find(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CATEGORY_NOT_FOUND", "Category was not found"));
    }

    public static String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Category name must contain letters or numbers");
        }
        return normalized;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
