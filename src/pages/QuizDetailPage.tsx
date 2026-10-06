import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '../components/Feedback';
import { useQuizQuery } from '../hooks/useQuizzes';
import { useQuizReportStatus } from '../hooks/useReports';
import ReportQuizDialog from './ReportQuizDialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../context/ToastContext';
import { XP_PER_CORRECT } from '../utils/xp';

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const query = useQuizQuery(id);
  const canReport = Boolean(user && id && !query.data?.official && !query.data?.can_edit);
  const reportStatus = useQuizReportStatus(id ?? '', canReport);

  if (query.isLoading) return <Loading label="Loading quiz…" />;
  if (query.isError || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const quiz = query.data;

  return (
    <Box>
      <Button component={RouterLink} to="/quizzes" sx={{ mb: 2 }}>
        Back to explore
      </Button>
      {!quiz.is_published && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This quiz is a draft and is not visible to other players.
        </Alert>
      )}
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {quiz.categories && (
                <Chip label={`${quiz.categories.icon ?? ''} ${quiz.categories.name}`.trim()} variant="outlined" />
              )}
              <Chip
                color={quiz.difficulty === 'Easy' ? 'success' : quiz.difficulty === 'Medium' ? 'warning' : 'error'}
                icon={<SignalCellularAltIcon fontSize="small" />}
                label={quiz.difficulty}
              />
              {quiz.time_limit !== null ? (
                <Chip
                  variant="outlined"
                  icon={<TimerOutlinedIcon fontSize="small" />}
                  label={`${Math.round(quiz.time_limit / 60)} min limit`}
                />
              ) : (
                <Chip variant="outlined" label="No time limit" />
              )}
              <Chip
                variant="outlined"
                color="primary"
                label={`${XP_PER_CORRECT[quiz.difficulty]} XP per correct answer`}
              />
            </Stack>
            <Typography variant="h3" fontWeight={800} sx={{ mt: 2 }}>
              {quiz.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {quiz.description || 'No description provided.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              By {quiz.profiles?.username ?? 'the QuizSpring community'} ·{' '}
              {new Date(quiz.created_at).toLocaleDateString()} · {quiz.attempt_count} attempts
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              {quiz.is_published && (
                <Button component={RouterLink} to={`/quizzes/${quiz.id}/play`} variant="contained" size="large">
                  Start quiz
                </Button>
              )}
              {quiz.can_edit && (
                <Button component={RouterLink} to={`/quizzes/${quiz.id}/edit`} variant="outlined" size="large">
                  Edit quiz
                </Button>
              )}
              {canReport && !reportStatus.data && (
                <Button
                  variant="text"
                  color="error"
                  size="large"
                  startIcon={<FlagOutlinedIcon />}
                  onClick={() => setReportOpen(true)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Report this quiz
                </Button>
              )}
              {canReport && reportStatus.data && (
                <Chip color="warning" variant="outlined" icon={<FlagOutlinedIcon />} label="Reported for review" />
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Question preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Answer choices and explanations stay private until you submit an attempt.
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {quiz.questions.length > 0 ? (
            <List dense>
              {quiz.questions.map((question, index) => (
                <ListItem key={question.id}>
                  <ListItemText primary={`${index + 1}. ${question.question_text}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">Question preview unavailable.</Typography>
          )}
        </CardContent>
      </Card>

      <ReportQuizDialog
        open={reportOpen}
        quizId={quiz.id}
        quizTitle={quiz.title}
        onClose={() => setReportOpen(false)}
        onReported={() => showToast('Thanks. A moderator will review this quiz.', 'success')}
      />
    </Box>
  );
}
