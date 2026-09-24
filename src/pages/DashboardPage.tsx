import { Avatar, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/Feedback';
import DashboardRowCard from '../components/DashboardRowCard';
import RecommendedQuizCard from '../components/RecommendedQuizCard';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardQuery } from '../hooks/useQuizzes';
import { formatSeconds, xpProgress } from '../utils/xp';

function scorePresentation(percentage: number): { accent: string; badge: string; color: string } {
  if (percentage >= 100) return { accent: 'success.main', badge: 'rgba(52,199,89,0.16)', color: 'success.main' };
  if (percentage >= 70) return { accent: 'primary.main', badge: 'rgba(0,113,227,0.12)', color: 'primary.main' };
  if (percentage >= 40) return { accent: 'warning.main', badge: 'rgba(255,159,10,0.18)', color: 'warning.main' };
  return { accent: 'error.main', badge: 'rgba(255,59,48,0.14)', color: 'error.main' };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboardQuery();
  const stats = dashboard.data?.stats;
  const profile = dashboard.data?.profile ?? user;
  const progress = xpProgress(profile?.total_xp ?? stats?.total_xp ?? 0);
  const name = profile?.username || user?.email.split('@')[0] || 'there';

  if (dashboard.isLoading) return <Loading label="Preparing your dashboard…" />;
  if (dashboard.isError || !dashboard.data || !stats || !profile) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  const recent = dashboard.data.recent;
  const recommended = dashboard.data.recommended;

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          backgroundColor: 'primary.main',
          color: '#fff',
          border: 'none',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar
            src={profile.avatar_url ?? undefined}
            sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.25)', fontWeight: 800, fontSize: 28 }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <Box flexGrow={1} minWidth={220}>
            <Typography variant="h4" fontWeight={800}>
              Hello, {name}
            </Typography>
            <Typography sx={{ opacity: 0.85 }}>
              Level {progress.level} · {stats.total_xp.toLocaleString()} XP · {progress.current}/{progress.needed} to
              next level
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress.pct}
              sx={{
                mt: 1.5,
                height: 8,
                borderRadius: 99,
                maxWidth: 420,
                bgcolor: 'rgba(255,255,255,0.25)',
                '& .MuiLinearProgress-bar': { bgcolor: '#fff' },
              }}
            />
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              component={RouterLink}
              to="/quizzes"
              variant="contained"
              sx={{ bgcolor: '#fff', color: '#0071e3', '&:hover': { bgcolor: '#f0f0f0' } }}
            >
              Explore quizzes
            </Button>
            <Button
              component={RouterLink}
              to="/quizzes/create"
              variant="outlined"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}
            >
              Create
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}
      >
        <StatCard
          label="Attempted"
          value={stats.attempted}
          sub="quizzes played"
          icon={<QuizOutlinedIcon color="primary" />}
        />
        <StatCard
          label="Total XP"
          value={stats.total_xp.toLocaleString()}
          sub={`Level ${stats.level}`}
          icon={<BoltOutlinedIcon color="secondary" />}
          progress={progress.pct}
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          sub="correct answers"
          icon={<TrackChangesOutlinedIcon color="success" />}
          progress={stats.accuracy}
        />
        <StatCard
          label="Day streak"
          value={stats.streak}
          sub={stats.created ? `${stats.created} quizzes created` : 'keep it going'}
          icon={<LocalFireDepartmentOutlinedIcon color="warning" />}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h5" fontWeight={800}>
              Recent activity
            </Typography>
          </Stack>
          {recent.length === 0 ? (
            <Card sx={{ flexGrow: 1, display: 'flex' }}>
              <EmptyState title="No attempts yet" body="Play your first quiz to see activity here." />
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {recent.map((attempt) => {
                const percentage = Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100);
                const presentation = scorePresentation(percentage);
                return (
                  <DashboardRowCard
                    key={attempt.id}
                    accent={presentation.accent}
                    badgeBackground={presentation.badge}
                    badgeColor={presentation.color}
                    badge={<EmojiEventsOutlinedIcon fontSize="small" />}
                    title={attempt.quiz?.title ?? 'Quiz'}
                    details={`${attempt.quiz?.difficulty ? `${attempt.quiz.difficulty} · ` : ''}${attempt.score}/${attempt.total_questions} correct · +${attempt.xp_earned} XP · ${formatSeconds(attempt.time_taken)} · ${new Date(attempt.completed_at).toLocaleDateString()}`}
                    status={
                      <Chip size="small" color={percentage === 100 ? 'success' : 'default'} label={`${percentage}%`} />
                    }
                    action={
                      <Button
                        component={RouterLink}
                        to={`/attempts/${attempt.id}`}
                        size="small"
                        variant="outlined"
                        sx={{ flexShrink: 0 }}
                      >
                        Review
                      </Button>
                    }
                  />
                );
              })}
            </Stack>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h5" fontWeight={800}>
              Recommended for you
            </Typography>
            <Button component={RouterLink} to="/quizzes" size="small">
              View all
            </Button>
          </Stack>
          {recommended.length === 0 ? (
            <Card sx={{ flexGrow: 1, display: 'flex' }}>
              <EmptyState title="Nothing to recommend yet" body="New quizzes will appear here." />
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {recommended.slice(0, 4).map((quiz) => (
                <RecommendedQuizCard key={quiz.id} quiz={quiz} />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
