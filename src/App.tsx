import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { RequireAdmin, RequireAuth, RequireGuest } from './routes/ProtectedRoute';
import { Loading } from './components/Feedback';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.ResetPasswordPage })),
);
const ChangePasswordPage = lazy(() =>
  import('./pages/AuthPages').then((module) => ({ default: module.ChangePasswordPage })),
);
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const QuizDetailPage = lazy(() => import('./pages/QuizDetailPage'));
const QuizAttemptPage = lazy(() => import('./pages/QuizAttemptPage'));
const QuizCreatePage = lazy(() => import('./pages/QuizCreatePage'));
const QuizEditPage = lazy(() => import('./pages/QuizEditPage'));
const QuizResultsPage = lazy(() => import('./pages/QuizResultsPage'));
const MyQuizzesPage = lazy(() => import('./pages/MyQuizzesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminQuizzesPage = lazy(() => import('./pages/admin/AdminQuizzesPage'));
const AdminAttemptsPage = lazy(() => import('./pages/admin/AdminAttemptsPage'));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <LazyPage>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<RequireGuest />}>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/quizzes/mine" element={<MyQuizzesPage />} />
            <Route path="/quizzes/create" element={<QuizCreatePage />} />
            <Route path="/quizzes/:id" element={<QuizDetailPage />} />
            <Route path="/quizzes/:id/play" element={<QuizAttemptPage />} />
            <Route path="/quizzes/:id/attempt" element={<QuizAttemptPage />} />
            <Route path="/quizzes/:id/edit" element={<QuizEditPage />} />
            <Route path="/create" element={<QuizCreatePage />} />
            <Route path="/attempts/:attemptId" element={<QuizResultsPage />} />
            <Route path="/results/:attemptId" element={<QuizResultsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<AppLayout />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminOverviewPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
              <Route path="/admin/attempts" element={<AdminAttemptsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LazyPage>
  );
}
