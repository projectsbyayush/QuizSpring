import { Navigate, useParams } from 'react-router-dom';
import QuizEditorPage from './QuizEditorPage';

export default function QuizEditPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/quizzes/mine" replace />;
  return <QuizEditorPage quizId={id} />;
}
