import { useQuery } from '@tanstack/react-query';
import { listQuizzes } from '../api/quizzes';
import type { QuizFilters } from '../types';

const officialFilters: QuizFilters = {
  search: '',
  categoryId: 'all',
  difficulty: 'all',
  sort: 'newest',
  page: 0,
  size: 24,
};

/**
 * Loads the platform-provided quiz catalogue. Used by the collections strip,
 * which groups the results by category in the browser so it never needs a
 * dedicated backend endpoint.
 */
export function useOfficialCollections() {
  return useQuery({
    queryKey: ['official-collections'],
    queryFn: () => listQuizzes(officialFilters),
    staleTime: 5 * 60 * 1000,
    select: (page) => page.content.filter((quiz) => quiz.official),
  });
}
