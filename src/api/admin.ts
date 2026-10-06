import { apiClient } from './client';
import type {
  AdminStats,
  AttemptHistory,
  AdminAttemptFilters,
  Category,
  CategoryInput,
  PageResponse,
  QuizSummary,
  Role,
  User,
} from '../types';

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/admin/stats');
  return {
    ...data,
    categories: data.categories ?? 0,
    active_7d: data.active_7d ?? data.active7d ?? 0,
    recent_signups: data.recent_signups ?? [],
    recent_attempts: data.recent_attempts ?? [],
  };
}

export async function listAdminUsers(
  search = '',
  role: Role | 'all' = 'all',
  page = 0,
  size = 50,
  banned?: boolean,
): Promise<PageResponse<User>> {
  const { data } = await apiClient.get<PageResponse<User>>('/admin/users', {
    params: { search: search.trim(), role, page, size, ...(banned === undefined ? {} : { banned }) },
  });
  return data;
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const { data } = await apiClient.patch<User>(`/admin/users/${id}/role`, { role });
  return data;
}

export async function updateUserBan(id: string, banned: boolean): Promise<User> {
  const { data } = await apiClient.patch<User>(`/admin/users/${id}/ban`, { banned });
  return data;
}

export async function listAdminQuizzes(
  search = '',
  page = 0,
  size = 50,
  categoryId?: string,
  difficulty?: string,
  published?: boolean,
): Promise<PageResponse<QuizSummary>> {
  const params: Record<string, string | number | boolean> = { search: search.trim(), page, size };
  if (categoryId) params.categoryId = categoryId;
  if (difficulty && difficulty !== 'all') params.difficulty = difficulty;
  if (published !== undefined) params.is_published = published;
  const { data } = await apiClient.get<PageResponse<QuizSummary>>('/admin/quizzes', { params });
  return data;
}

export async function setQuizPublished(id: string, published: boolean): Promise<QuizSummary> {
  const { data } = await apiClient.patch<QuizSummary>(`/admin/quizzes/${id}/publish`, { is_published: published });
  return data;
}

export async function deleteAdminQuiz(id: string): Promise<void> {
  await apiClient.delete<void>(`/admin/quizzes/${id}`);
}

export async function listAdminAttempts(
  filters: AdminAttemptFilters,
  page = 0,
  size = 50,
): Promise<PageResponse<AttemptHistory>> {
  const params: Record<string, string | number> = { page, size };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.userId.trim()) params.userId = filters.userId.trim();
  if (filters.quizId.trim()) params.quizId = filters.quizId.trim();
  if (filters.from) params.from = new Date(`${filters.from}T00:00:00Z`).toISOString();
  if (filters.to) params.to = new Date(`${filters.to}T23:59:59Z`).toISOString();
  const { data } = await apiClient.get<PageResponse<AttemptHistory>>('/admin/attempts', { params });
  return data;
}

export async function listAdminCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/admin/categories');
  return data;
}

export async function createAdminCategory(input: CategoryInput): Promise<Category> {
  const { data } = await apiClient.post<Category>('/admin/categories', input);
  return data;
}

export async function updateAdminCategory(id: string, input: CategoryInput): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/admin/categories/${id}`, input);
  return data;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await apiClient.delete<void>(`/admin/categories/${id}`);
}
