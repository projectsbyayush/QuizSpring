import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '../components/Feedback';
import { useAttemptQuery } from '../hooks/useQuizzes';
import type { AttemptAnswer, AttemptHistory, AttemptResult, SafeQuestion, XpBreakdown } from '../types';
import { formatSeconds } from '../utils/xp';

interface ResultState {
  result?: AttemptResult;
  questions?: SafeQuestion[];
}

function optionLabel(index: number | null | undefined, options?: string[]): string {
  if (index === null || index === undefined) return 'No answer';
  const text = options?.[index];
  return text ? `Option ${String.fromCharCode(65 + index)}: ${text}` : `Option ${String.fromCharCode(65 + index)}`;
}

function answerReview(answer: AttemptAnswer, index: number, questions: SafeQuestion[]) {
  const question = questions.find((item) => item.id === answer.question_id);
  const text = answer.question_text ?? question?.question_text ?? 'Question';
  return (
    <Box key={answer.question_id}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {answer.correct ? <CheckCircleOutlineIcon color="success" /> : <CancelOutlinedIcon color="error" />}
        <Box flexGrow={1}>
          <Typography fontWeight={600}>
            {index + 1}. {text}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 0.75 }}>
            <Chip
              size="small"
              variant="outlined"
              label={`Your answer: ${optionLabel(answer.selected, answer.options)}`}
            />
            <Chip
              size="small"
              color={answer.correct ? 'success' : 'error'}
              label={`Correct: ${optionLabel(answer.correct_answer, answer.options)}`}
            />
          </Stack>
          {answer.explanation && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              {answer.explanation}
            </Alert>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

export default function QuizResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const state = location.state as ResultState | null;
  const query = useAttemptQuery(attemptId);
  const attempt: AttemptHistory | AttemptResult | undefined = query.data ?? state?.result;
  const questions = state?.questions ?? [];

  if (query.isLoading && !state?.result) return <Loading label="Loading your result…" />;
  if (query.isError && !state?.result) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!attempt) return <ErrorState error={new Error('This attempt could not be found.')} />;

  const percentage = Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100);
  const title = attempt.quiz?.title ?? 'Quiz result';
  const breakdown: XpBreakdown | undefined = 'xp' in attempt ? attempt.xp : undefined;

  return (
    <Box maxWidth={820} mx="auto">
      {state?.result && query.isFetching && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Refreshing the saved result…
        </Alert>
      )}
      <Card sx={{ textAlign: 'center' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="overline" color="primary" fontWeight={700}>
            Attempt complete
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>
            {percentage}%
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mt: 0.5 }}>
            {attempt.score}/{attempt.total_questions} correct · {title}
          </Typography>
          <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Chip color="primary" label={`+${attempt.xp_earned} XP`} />
            {breakdown && <Chip variant="outlined" label={`Base ${breakdown.base}`} />}
            {breakdown && <Chip variant="outlined" label={`Time ${breakdown.time_bonus}`} />}
            {breakdown && <Chip variant="outlined" label={`Streak ${breakdown.streak_bonus}`} />}
            <Chip variant="outlined" label={formatSeconds(attempt.time_taken)} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button component={RouterLink} to="/dashboard" variant="contained">
              Go to dashboard
            </Button>
            <Button component={RouterLink} to="/quizzes" variant="outlined">
              Explore more
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Answer review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Correct answers and explanations are revealed only after submission.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2.5}>{attempt.answers.map((answer, index) => answerReview(answer, index, questions))}</Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
