import { apiClient } from './client';
import type { ProfileUpdateInput, User } from '../types';

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<User>('/profile');
  return data;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<User> {
  const { data } = await apiClient.patch<User>('/profile', input);
  return data;
}
