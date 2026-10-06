import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasOpenReport,
  listAdminReports,
  resolveAdminReport,
  submitQuizReport,
  unpublishReportedQuiz,
} from '../api/reports';
import type { ReportReason, ReportStatus } from '../types';

export const reportKeys = {
  quiz: (quizId: string) => ['quiz-report', quizId] as const,
  admin: (status: ReportStatus, page: number) => ['admin', 'reports', status, page] as const,
};

export function useQuizReportStatus(quizId: string, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.quiz(quizId),
    queryFn: () => hasOpenReport(quizId),
    enabled,
    staleTime: 30_000,
  });
}

export function useSubmitReport(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { reason: ReportReason; details?: string | null }) => submitQuizReport(quizId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.quiz(quizId) }),
  });
}

export function useAdminReportsQuery(status: ReportStatus, page: number) {
  return useQuery({
    queryKey: reportKeys.admin(status, page),
    queryFn: () => listAdminReports(status, page),
    placeholderData: (previous) => previous,
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, next, note }: { id: string; next: Exclude<ReportStatus, 'OPEN'>; note?: string | null }) =>
      resolveAdminReport(id, { status: next, note }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      void queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

export function useUnpublishReportedQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unpublishReportedQuiz,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      void queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
