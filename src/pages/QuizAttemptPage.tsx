import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { submitAttempt as submitAttemptRequest } from '../api/attempts';
import { getErrorMessage } from '../api/client';
import { ErrorState, Loading } from '../components/Feedback';
import { useAuth } from '../contexts/AuthContext';
import { useAttemptStartQuery, useQuizForPlayQuery } from '../hooks/useQuizzes';
import { formatSeconds } from '../utils/xp';

export default function QuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const quizQuery = useQuizForPlayQuery(id);
  const startQuery = useAttemptStartQuery(id);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const submittingRef = useRef(false);

  const quiz = quizQuery.data;
  const attemptStart = startQuery.data;
  const questions = useMemo(() => attemptStart?.questions ?? [], [attemptStart]);
  const current = questions[index];
  const answeredCount = Object.keys(selected).length;
  const timeLimit = attemptStart?.time_limit ?? quiz?.time_limit ?? null;
  const timeLeft = timeLimit !== null ? timeLimit - elapsed : null;

  useEffect(() => {
    if (!attemptStart) return;
    const parsedStart = Date.parse(attemptStart.started_at);
    startTimeRef.current = Number.isNaN(parsedStart) ? Date.now() : parsedStart;
    setSelected({});
    setIndex(0);
    setElapsed(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    setSubmitted(false);
    setError(null);
  }, [attemptStart]);

  const submit = useCallback(async (): Promise<void> => {
    if (!id || !attemptStart || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmOpen(false);
    setError(null);
    try {
      const result = await submitAttemptRequest(attemptStart.attempt_id, {
        quiz_id: id,
        answers: selected,
        time_taken: Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['accuracy'] }),
        queryClient.invalidateQueries({ queryKey: ['attempts'] }),
      ]);
      await refreshProfile();
      setSubmitted(true);
      navigate(`/attempts/${result.attempt_id}`, { replace: true, state: { result, questions } });
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attemptStart, id, navigate, queryClient, questions, refreshProfile, selected]);

  useEffect(() => {
    if (!attemptStart || submitted) return;
    const updateElapsed = (): void => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [attemptStart, submitted]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && !submitted && attemptStart) void submit();
  }, [attemptStart, submit, submitted, timeLeft]);

  if (quizQuery.isLoading || startQuery.isLoading) return <Loading label="Preparing your attempt…" />;
  if (quizQuery.isError || startQuery.isError || !quiz || !attemptStart) {
    const queryError = quizQuery.error ?? startQuery.error ?? new Error('This attempt could not be started.');
    return <ErrorState error={queryError} onRetry={() => void startQuery.refetch()} />;
  }
  if (questions.length === 0) return <ErrorState error={new Error('This quiz does not have any questions.')} />;

  return (
    <Box maxWidth={760} mx="auto">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h6" fontWeight={800} noWrap sx={{ minWidth: 0, flexGrow: 1 }}>
          {quiz.title}
        </Typography>
        <Chip
          icon={<TimerOutlinedIcon fontSize="small" />}
          label={timeLeft !== null ? formatSeconds(Math.max(0, timeLeft)) : `${formatSeconds(elapsed)} elapsed`}
          color={timeLeft !== null && timeLeft < 60 ? 'error' : 'default'}
        />
      </Stack>
      <LinearProgress
        variant="determinate"
        value={((index + 1) / Math.max(1, questions.length)) * 100}
        sx={{ borderRadius: 99, height: 8, mb: 1 }}
      />
      <Typography variant="caption" color="text.secondary">
        Question {index + 1} of {questions.length} · {answeredCount} answered
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {current && (
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {current.question_text}
            </Typography>
            <RadioGroup
              value={selected[current.id] === undefined ? '' : String(selected[current.id])}
              onChange={(event) =>
                setSelected((currentAnswers) => ({ ...currentAnswers, [current.id]: Number(event.target.value) }))
              }
            >
              {current.options.map((option, optionIndex) => (
                <FormControlLabel
                  key={`${current.id}-${optionIndex}`}
                  value={String(optionIndex)}
                  control={<Radio />}
                  label={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    px: 1.5,
                    mb: 1,
                    ml: 0,
                    mr: 0,
                    width: '100%',
                  }}
                />
              ))}
            </RadioGroup>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                disabled={index === 0}
                onClick={() => setIndex((currentIndex) => currentIndex - 1)}
                variant="outlined"
              >
                Previous
              </Button>
              <Box flexGrow={1} />
              {index < questions.length - 1 ? (
                <Button variant="contained" onClick={() => setIndex((currentIndex) => currentIndex + 1)}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" disabled={submitting} onClick={() => setConfirmOpen(true)}>
                  {submitting ? 'Submitting…' : 'Review and submit'}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }} useFlexGap>
        {questions.map((question, questionIndex) => (
          <Chip
            key={question.id}
            size="small"
            label={questionIndex + 1}
            color={selected[question.id] !== undefined ? 'primary' : 'default'}
            variant={questionIndex === index ? 'filled' : 'outlined'}
            onClick={() => setIndex(questionIndex)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>
      <Button component={RouterLink} to={`/quizzes/${quiz.id}`} sx={{ mt: 2 }}>
        Quit and view details
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Submit this attempt?</DialogTitle>
        <DialogContent>
          <Typography>
            You answered {answeredCount} of {questions.length} questions. Your answers cannot be changed after
            submission.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1,
            '& > :not(style) ~ :not(style)': { marginLeft: 0 },
          }}
        >
          <Button onClick={() => setConfirmOpen(false)}>Keep reviewing</Button>
          <Button variant="contained" onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit attempt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
