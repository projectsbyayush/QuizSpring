import { Button, Chip, Link as MuiLink } from '@mui/material';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { Link as RouterLink } from 'react-router-dom';
import DashboardRowCard from './DashboardRowCard';
import type { Difficulty, QuizSummary } from '../types';

const difficultyPresentation: Record<Difficulty, { accent: string; badge: string; color: string }> = {
  Easy: { accent: 'success.main', badge: 'rgba(52,199,89,0.16)', color: 'success.main' },
  Medium: { accent: 'warning.main', badge: 'rgba(255,159,10,0.18)', color: 'warning.main' },
  Hard: { accent: 'error.main', badge: 'rgba(255,59,48,0.14)', color: 'error.main' },
};

export default function RecommendedQuizCard({ quiz }: { quiz: QuizSummary }) {
  const presentation = difficultyPresentation[quiz.difficulty];
  const details = [
    quiz.categories?.name,
    `${quiz.question_count} ${quiz.question_count === 1 ? 'question' : 'questions'}`,
    quiz.time_limit !== null ? `${Math.max(1, Math.round(quiz.time_limit / 60))} min` : null,
    quiz.profiles?.username ? `by ${quiz.profiles.username}` : null,
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <DashboardRowCard
      accent={presentation.accent}
      badgeBackground={presentation.badge}
      badgeColor={presentation.color}
      badge={<QuizOutlinedIcon fontSize="small" />}
      title={
        <MuiLink
          component={RouterLink}
          to={`/quizzes/${quiz.id}`}
          color="inherit"
          noWrap
          sx={{ display: 'block', fontWeight: 700 }}
        >
          {quiz.title}
        </MuiLink>
      }
      details={details.join(' · ')}
      status={
        <Chip
          size="small"
          color={quiz.difficulty === 'Easy' ? 'success' : quiz.difficulty === 'Medium' ? 'warning' : 'error'}
          label={quiz.difficulty}
        />
      }
      action={
        <Button
          component={RouterLink}
          to={`/quizzes/${quiz.id}/play`}
          size="small"
          variant="contained"
          sx={{ flexShrink: 0 }}
        >
          Play
        </Button>
      }
    />
  );
}
