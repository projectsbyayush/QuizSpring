import { apiClient } from './client';
import type { PageResponse, QuizReport, ReportReason, ReportStatus } from '../types';

export async function submitQuizReport(
  quizId: string,
  input: { reason: ReportReason; details?: string | null },
): Promise<QuizReport> {
  const { data } = await apiClient.post<QuizReport>(`/quizzes/${quizId}/report`, {
    reason: input.reason,
    details: input.details?.trim() ? input.details.trim() : null,
  });
  return data;
}

export async function hasOpenReport(quizId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ reported: boolean }>(`/quizzes/${quizId}/report/status`);
  return Boolean(data?.reported);
}

export async function listAdminReports(status: ReportStatus = 'OPEN', page = 0): Promise<PageResponse<QuizReport>> {
  const { data } = await apiClient.get<PageResponse<QuizReport>>('/admin/reports', { params: { status, page } });
  return data;
}

export async function resolveAdminReport(
  id: string,
  input: { status: Exclude<ReportStatus, 'OPEN'>; note?: string | null },
): Promise<QuizReport> {
  const { data } = await apiClient.patch<QuizReport>(`/admin/reports/${id}`, {
    status: input.status,
    note: input.note?.trim() ? input.note.trim() : null,
  });
  return data;
}

export async function unpublishReportedQuiz(id: string): Promise<void> {
  await apiClient.post<void>(`/admin/reports/${id}/unpublish-quiz`);
}
