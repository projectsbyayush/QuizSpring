import { apiClient, persistAuthResponse } from './client';
import type {
  AuthResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  MessageResponse,
  PasswordResetResponse,
  RegisterInput,
  ResetPasswordInput,
  User,
} from '../types';

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  persistAuthResponse(data);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
  persistAuthResponse(data);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<PasswordResetResponse> {
  const { data } = await apiClient.post<PasswordResetResponse>('/auth/forgot-password', input);
  return data;
}

export async function resetPassword(input: ResetPasswordInput): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', input);
  return data;
}

export async function changePassword(input: ChangePasswordInput): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>('/profile/change-password', input);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post<void>('/auth/logout', { refresh_token: refreshToken });
}
