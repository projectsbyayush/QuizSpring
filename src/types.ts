export type Role = 'user' | 'admin';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuizSort = 'newest' | 'popular' | 'title';

export interface User {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  role: Role;
  total_xp: number;
  level: number;
  streak: number;
  current_streak?: number;
  longest_streak?: number;
  last_active_date: string | null;
  is_banned: boolean;
  created_at: string;
}

export type Profile = User;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: number | null;
  explanation: string | null;
  order: number;
}

export type SafeQuestion = Omit<Question, 'correct_answer' | 'explanation'>;

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  categories: Category | null;
  created_by: string | null;
  profiles: Pick<User, 'username' | 'avatar_url'> | null;
  difficulty: Difficulty;
  time_limit: number | null;
  is_published: boolean;
  created_at: string;
  question_count: number;
  attempt_count: number;
  can_edit: boolean;
}

export interface Quiz extends QuizSummary {
  questions?: Question[];
}

export interface QuizDetail extends Omit<QuizSummary, never> {
  questions: SafeQuestion[];
}

export interface ManagedQuizDetail extends Omit<QuizSummary, never> {
  questions: Question[];
}

export interface AttemptAnswer {
  question_id: string;
  selected: number | null;
  correct_answer: number | null;
  correct: boolean;
  question_text?: string | null;
  options?: string[];
  explanation?: string | null;
}

export interface AttemptHistory {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  xp_earned: number;
  time_taken: number | null;
  completed_at: string;
  answers: AttemptAnswer[];
  quiz: QuizSummary | null;
  xp?: XpBreakdown;
}

export interface XpBreakdown {
  base: number;
  time_bonus: number;
  streak_bonus: number;
  total: number;
}

export interface AttemptResult {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  xp_earned: number;
  time_taken: number | null;
  completed_at: string;
  xp: XpBreakdown;
  answers: AttemptAnswer[];
  quiz: QuizSummary | null;
}

export interface DashboardStats {
  attempted: number;
  total_xp: number;
  level: number;
  accuracy: number;
  created: number;
  streak: number;
  current_streak?: number;
  longest_streak?: number;
  xp_into_level?: number;
  xp_needed_for_next_level?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  profile: User;
  recent: AttemptHistory[];
  recommended: QuizSummary[];
}

export interface AccuracyData {
  correct: number;
  total: number;
  percentage: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}

export interface AdminStats {
  users: number;
  quizzes: number;
  categories: number;
  attempts: number;
  active_7d: number;
  active7d?: number;
  recent_quizzes: AdminRecentQuiz[];
  recent_signups: AdminRecentSignup[];
  recent_attempts: AdminRecentAttempt[];
}

export interface AdminRecentQuiz {
  id: string;
  title: string;
  created_at: string;
}

export interface AdminRecentSignup {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface AdminRecentAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface AdminAttemptFilters {
  search: string;
  userId: string;
  quizId: string;
  from: string;
  to: string;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
  field_errors?: Record<string, string>;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface PasswordResetResponse {
  message: string;
  token: string | null;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  new_password: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export interface ProfileUpdateInput {
  username?: string;
  avatar_url?: string;
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface QuestionInput {
  question_text: string;
  options: [string, string, string, string];
  correct_answer: number;
  explanation?: string | null;
}

export interface QuizCreateInput {
  title: string;
  description?: string | null;
  category_id: string;
  difficulty: Difficulty;
  time_limit: number | null;
  is_published: boolean;
  questions: QuestionInput[];
}

export type QuizUpdateInput = QuizCreateInput;

export interface QuizFilters {
  search: string;
  categoryId: string;
  difficulty: Difficulty | 'all';
  sort: QuizSort;
  page: number;
  size: number;
  includeDrafts?: boolean;
}

export interface SubmitAttemptInput {
  quiz_id?: string;
  answers: Record<string, number | null>;
  time_taken?: number;
}

export interface AttemptStart {
  attempt_id: string;
  quiz_id: string;
  status: 'PENDING';
  started_at: string;
  expires_at: string | null;
  time_limit: number | null;
  grace_period_seconds: number;
  questions: SafeQuestion[];
}
