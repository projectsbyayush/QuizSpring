import { apiClient } from './client';
import type {
  AccuracyData,
  AttemptHistory,
  AttemptResult,
  AttemptStart,
  PageResponse,
  SubmitAttemptInput,
} from '../types';

export async function startAttempt(quizId: string): Promise<AttemptStart> {
  const { data } = await apiClient.post<AttemptStart>(`/quizzes/${quizId}/start`);
  return data;
}

export async function submitAttempt(attemptId: string, input: SubmitAttemptInput): Promise<AttemptResult> {
  const { data } = await apiClient.post<AttemptResult>(`/attempts/${attemptId}/submit`, input);
  return data;
}

export async function submitLegacyAttempt(input: SubmitAttemptInput): Promise<AttemptResult> {
  if (!input.quiz_id) throw new Error('A quiz id is required to start an attempt.');
  const { data } = await apiClient.post<AttemptResult>('/attempts', input);
  return data;
}

export async function getAttemptHistory(page = 0, size = 20): Promise<PageResponse<AttemptHistory>> {
  const { data } = await apiClient.get<PageResponse<AttemptHistory>>('/attempts/mine', { params: { page, size } });
  return data;
}

export async function getAttempt(id: string): Promise<AttemptHistory> {
  const { data } = await apiClient.get<AttemptHistory>(`/attempts/${id}`);
  return data;
}

export async function getAccuracy(): Promise<AccuracyData> {
  const { data } = await apiClient.get<AccuracyData>('/attempts/accuracy');
  return data;
}
