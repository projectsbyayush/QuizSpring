import { apiClient } from './client';
import type {
  ManagedQuizDetail,
  PageResponse,
  Question,
  QuizCreateInput,
  QuizDetail,
  QuizFilters,
  QuizSummary,
  QuizUpdateInput,
  SafeQuestion,
} from '../types';

export async function listMyQuizzes(filters: QuizFilters): Promise<PageResponse<QuizSummary>> {
  const { data } = await apiClient.get<PageResponse<QuizSummary>>('/quizzes/mine', {
    params: { search: filters.search.trim(), page: filters.page, size: filters.size },
  });
  return data;
}

export async function listQuizzes(filters: QuizFilters): Promise<PageResponse<QuizSummary>> {
  const params: Record<string, string | number | boolean> = {
    search: filters.search.trim(),
    sort: filters.sort,
    page: filters.page,
    size: filters.size,
  };
  if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;
  if (filters.difficulty !== 'all') params.difficulty = filters.difficulty;
  if (filters.includeDrafts) params.includeDrafts = true;
  const { data } = await apiClient.get<PageResponse<QuizSummary>>('/quizzes', { params });
  return data;
}

function toSafeQuestion(question: Question): SafeQuestion {
  return {
    id: question.id,
    quiz_id: question.quiz_id,
    question_text: question.question_text,
    options: question.options,
    order: question.order,
  };
}

function toSafeQuiz(quiz: ManagedQuizDetail): QuizDetail {
  return {
    ...quiz,
    questions: quiz.questions.map(toSafeQuestion),
  };
}

export async function getQuiz(id: string): Promise<QuizDetail> {
  const { data } = await apiClient.get<ManagedQuizDetail>(`/quizzes/${id}`);
  return toSafeQuiz(data);
}

export async function getQuizForEdit(id: string): Promise<ManagedQuizDetail> {
  const { data } = await apiClient.get<ManagedQuizDetail>(`/quizzes/${id}`);
  return data;
}

export async function getQuizForPlay(id: string): Promise<QuizDetail> {
  const { data } = await apiClient.get<ManagedQuizDetail>(`/quizzes/${id}/play`);
  return toSafeQuiz(data);
}

export async function createQuiz(input: QuizCreateInput): Promise<ManagedQuizDetail> {
  const { data } = await apiClient.post<ManagedQuizDetail>('/quizzes', input);
  return data;
}

export async function updateQuiz(id: string, input: QuizUpdateInput): Promise<ManagedQuizDetail> {
  const { data } = await apiClient.put<ManagedQuizDetail>(`/quizzes/${id}`, input);
  return data;
}

export async function deleteQuiz(id: string): Promise<void> {
  await apiClient.delete<void>(`/quizzes/${id}`);
}
