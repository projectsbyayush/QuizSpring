import { apiClient } from './client';
import type { Category, CategoryInput } from '../types';

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories');
  return data;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', input);
  return data;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete<void>(`/categories/${id}`);
}
