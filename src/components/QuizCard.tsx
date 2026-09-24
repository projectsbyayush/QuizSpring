import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Link as RouterLink } from 'react-router-dom';
import type { Difficulty, QuizSummary } from '../types';

const difficultyColor: Record<Difficulty, 'success' | 'warning' | 'error'> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'error',
};

export default function QuizCard({ quiz, showEdit = false }: { quiz: QuizSummary; showEdit?: boolean }) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        transition: 'transform .2s ease',
        '&:hover': { transform: 'translateY(-3px)' },
      }}
    >
      <CardContent sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minHeight: 32 }}>
          {quiz.categories && (
            <Chip
              size="small"
              label={`${quiz.categories.icon ?? ''} ${quiz.categories.name}`.trim()}
              variant="outlined"
            />
          )}
          <Chip
            size="small"
            color={difficultyColor[quiz.difficulty]}
            label={quiz.difficulty}
            icon={<SignalCellularAltIcon fontSize="small" />}
          />
          {quiz.time_limit !== null && (
            <Chip
              size="small"
              variant="outlined"
              icon={<TimerOutlinedIcon fontSize="small" />}
              label={`${Math.round(quiz.time_limit / 60)} min`}
            />
          )}
          {!quiz.is_published && <Chip size="small" color="warning" label="Draft" />}
        </Stack>
        <Typography variant="h6" fontWeight={700} lineHeight={1.25} noWrap>
          {quiz.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 44,
          }}
        >
          {quiz.description || 'No description provided.'}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {quiz.question_count} questions · {quiz.attempt_count} attempts
          {quiz.profiles?.username ? ` · by ${quiz.profiles.username}` : ''}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
          <Button component={RouterLink} to={`/quizzes/${quiz.id}`} variant="contained" size="small" fullWidth>
            View
          </Button>
          {quiz.is_published ? (
            <Button component={RouterLink} to={`/quizzes/${quiz.id}/play`} variant="outlined" size="small" fullWidth>
              Play
            </Button>
          ) : (
            <Button component={RouterLink} to={`/quizzes/${quiz.id}/edit`} variant="outlined" size="small" fullWidth>
              Edit
            </Button>
          )}
          {showEdit && quiz.can_edit && (
            <Button
              component={RouterLink}
              to={`/quizzes/${quiz.id}/edit`}
              variant="text"
              size="small"
              aria-label={`Edit ${quiz.title}`}
            >
              Edit
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
