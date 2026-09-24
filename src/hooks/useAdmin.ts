import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAdminStats, listAdminAttempts, listAdminCategories, listAdminQuizzes, listAdminUsers } from '../api/admin';
import type { AdminAttemptFilters, Role } from '../types';

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: (search: string, role: Role | 'all', status: 'all' | 'active' | 'banned', page: number) =>
    ['admin', 'users', search, role, status, page] as const,
  quizzes: (search: string, categoryId: string, difficulty: string, page: number) =>
    ['admin', 'quizzes', search, categoryId, difficulty, page] as const,
  attempts: (filters: AdminAttemptFilters, page: number) => ['admin', 'attempts', filters, page] as const,
  categories: ['admin', 'categories'] as const,
};

export function useAdminStatsQuery() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: getAdminStats });
}

export function useAdminUsersQuery(
  search: string,
  role: Role | 'all',
  status: 'all' | 'active' | 'banned',
  page: number,
) {
  const banned = status === 'all' ? undefined : status === 'banned';
  return useQuery({
    queryKey: adminKeys.users(search, role, status, page),
    queryFn: () => listAdminUsers(search, role, page, 50, banned),
    placeholderData: keepPreviousData,
  });
}

export function useAdminQuizzesQuery(search: string, categoryId: string, difficulty: string, page: number) {
  return useQuery({
    queryKey: adminKeys.quizzes(search, categoryId, difficulty, page),
    queryFn: () => listAdminQuizzes(search, page, 50, categoryId || undefined, difficulty),
    placeholderData: keepPreviousData,
  });
}

export function useAdminAttemptsQuery(filters: AdminAttemptFilters, page: number) {
  return useQuery({
    queryKey: adminKeys.attempts(filters, page),
    queryFn: () => listAdminAttempts(filters, page),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCategoriesQuery() {
  return useQuery({ queryKey: adminKeys.categories, queryFn: listAdminCategories });
}
