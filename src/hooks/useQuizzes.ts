import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAccuracy, getAttempt, getAttemptHistory, startAttempt } from '../api/attempts';
import { listCategories } from '../api/categories';
import { getDashboard } from '../api/dashboard';
import { getProfile } from '../api/profile';
import { getQuiz, getQuizForEdit, getQuizForPlay, listMyQuizzes, listQuizzes } from '../api/quizzes';
import type { QuizFilters } from '../types';

export const queryKeys = {
  categories: ['categories'] as const,
  quizzes: (filters: QuizFilters) => ['quizzes', filters] as const,
  myQuizzes: (filters: QuizFilters) => ['my-quizzes', filters] as const,
  quiz: (id: string) => ['quiz', id] as const,
  quizEdit: (id: string) => ['quiz', id, 'edit'] as const,
  quizPlay: (id: string) => ['quiz', id, 'play'] as const,
  dashboard: ['dashboard'] as const,
  profile: ['profile'] as const,
  attempts: (page: number) => ['attempts', page] as const,
  attempt: (id: string) => ['attempt', id] as const,
  accuracy: ['accuracy'] as const,
  attemptStart: (id: string) => ['attempt-start', id] as const,
};

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
}

export function useMyQuizzesQuery(filters: QuizFilters) {
  return useQuery({
    queryKey: queryKeys.myQuizzes(filters),
    queryFn: () => listMyQuizzes(filters),
    placeholderData: keepPreviousData,
  });
}

export function useQuizListQuery(filters: QuizFilters) {
  return useQuery({
    queryKey: queryKeys.quizzes(filters),
    queryFn: () => listQuizzes(filters),
    placeholderData: keepPreviousData,
  });
}

export function useQuizQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.quiz(id ?? 'missing'),
    queryFn: () => getQuiz(id as string),
    enabled: Boolean(id),
  });
}

export function useQuizForEditQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.quizEdit(id ?? 'missing'),
    queryFn: () => getQuizForEdit(id as string),
    enabled: Boolean(id),
  });
}

export function useQuizForPlayQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.quizPlay(id ?? 'missing'),
    queryFn: () => getQuizForPlay(id as string),
    enabled: Boolean(id),
  });
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
  });
}

export function useAttemptHistoryQuery(page = 0) {
  return useQuery({
    queryKey: queryKeys.attempts(page),
    queryFn: () => getAttemptHistory(page),
    placeholderData: keepPreviousData,
  });
}

export function useAttemptQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attempt(id ?? 'missing'),
    queryFn: () => getAttempt(id as string),
    enabled: Boolean(id),
  });
}

export function useAccuracyQuery() {
  return useQuery({
    queryKey: queryKeys.accuracy,
    queryFn: getAccuracy,
  });
}

export function useAttemptStartQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attemptStart(id ?? 'missing'),
    queryFn: () => startAttempt(id as string),
    enabled: Boolean(id),
    staleTime: 0,
    retry: 1,
  });
}
