import { useMemo, useState } from 'react';
import { Avatar, Box, Button, Card, CardContent, Chip, Divider, Pagination, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/Feedback';
import StatCard from '../components/StatCard';
import { useAccuracyQuery, useAttemptHistoryQuery, useDashboardQuery, useProfileQuery } from '../hooks/useQuizzes';
import { formatSeconds, xpProgress } from '../utils/xp';

function badgesFor(level: number, streak: number, attempted: number): string[] {
  const values: string[] = [];
  if (attempted >= 1) values.push('First steps');
  if (attempted >= 10) values.push('Quiz regular');
  if (attempted >= 50) values.push('Quiz master');
  if (level >= 5) values.push('Rising star');
  if (level >= 10) values.push('Elite scholar');
  if (streak >= 3) values.push('Three-day streak');
  if (streak >= 7) values.push('Seven-day streak');
  return values.length > 0 ? values : ['Newcomer'];
}

export default function ProfilePage() {
  const profileQuery = useProfileQuery();
  const dashboardQuery = useDashboardQuery();
  const [historyPage, setHistoryPage] = useState(0);
  const historyQuery = useAttemptHistoryQuery(historyPage);
  const accuracyQuery = useAccuracyQuery();

  const profile = profileQuery.data;
  const dashboard = dashboardQuery.data;
  const attempts = useMemo(() => historyQuery.data?.content ?? [], [historyQuery.data?.content]);
  const accuracy = accuracyQuery.data;
  const progress = xpProgress(profile?.total_xp ?? 0);
  const badges = useMemo(
    () => badgesFor(progress.level, profile?.streak ?? 0, dashboard?.stats.attempted ?? 0),
    [dashboard?.stats.attempted, progress.level, profile?.streak],
  );
  const favoriteCategories = useMemo(() => {
    const counts = new Map<string, number>();
    attempts.forEach((attempt) => {
      const name = attempt.quiz?.categories?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [attempts]);

  if (profileQuery.isLoading || dashboardQuery.isLoading) return <Loading label="Loading your profile…" />;
  if (profileQuery.isError || dashboardQuery.isError || !profile) {
    return (
      <ErrorState
        error={profileQuery.error ?? dashboardQuery.error}
        onRetry={() => {
          void profileQuery.refetch();
          void dashboardQuery.refetch();
        }}
      />
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', p: { xs: 3, md: 4 } }}>
          <Avatar
            src={profile.avatar_url ?? undefined}
            sx={{ width: 84, height: 84, bgcolor: 'primary.main', fontSize: 36, fontWeight: 800 }}
          >
            {(profile.username || profile.email).charAt(0).toUpperCase()}
          </Avatar>
          <Box flexGrow={1} minWidth={220}>
            <Typography variant="h4" fontWeight={800}>
              {profile.username || profile.email.split('@')[0]}
            </Typography>
            <Typography color="text.secondary">
              {profile.email} · {profile.role === 'admin' ? 'Administrator' : 'Member'} · joined{' '}
              {new Date(profile.created_at).toLocaleDateString()}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }} useFlexGap>
              {badges.map((badge) => (
                <Chip key={badge} size="small" label={badge} />
              ))}
            </Stack>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={RouterLink} to="/profile/edit" variant="contained">
              Edit profile
            </Button>
            <Button component={RouterLink} to="/change-password" variant="outlined">
              Change password
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2.5, mb: 3 }}
      >
        <StatCard
          label="Total XP"
          value={profile.total_xp.toLocaleString()}
          sub={`Level ${progress.level}`}
          progress={progress.pct}
          accent="primary.main"
        />
        <StatCard
          label="Attempted"
          value={dashboard?.stats.attempted ?? 0}
          sub={`${accuracy?.correct ?? 0}/${accuracy?.total ?? 0} correct`}
          accent="secondary.main"
        />
        <StatCard
          label="Accuracy"
          value={`${accuracy?.percentage ?? 0}%`}
          progress={accuracy?.percentage ?? 0}
          accent="success.main"
        />
        <StatCard label="Day streak" value={profile.streak} sub="Keep your momentum" accent="warning.main" />
        <StatCard
          label="Quizzes created"
          value={dashboard?.stats.created ?? 0}
          sub="Published and drafts"
          accent="info.main"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Attempt history
          </Typography>
          {historyQuery.isLoading ? (
            <Loading />
          ) : historyQuery.isError ? (
            <ErrorState error={historyQuery.error} onRetry={() => void historyQuery.refetch()} />
          ) : attempts.length === 0 ? (
            <Card>
              <EmptyState title="No attempts yet" body="Your history will appear here." />
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {attempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box flexGrow={1} minWidth={200}>
                      <Typography fontWeight={700} noWrap>
                        {attempt.quiz?.title ?? 'Quiz'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {attempt.score}/{attempt.total_questions} · +{attempt.xp_earned} XP ·{' '}
                        {formatSeconds(attempt.time_taken)} · {new Date(attempt.completed_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {attempt.quiz && <Chip size="small" label={attempt.quiz.difficulty} variant="outlined" />}
                      <Button component={RouterLink} to={`/attempts/${attempt.id}`} size="small">
                        Review
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
          {historyQuery.data && historyQuery.data.total_pages > 1 && (
            <Pagination
              count={historyQuery.data.total_pages}
              page={historyPage + 1}
              onChange={(_event, value) => setHistoryPage(value - 1)}
              sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
            />
          )}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Favorite categories
          </Typography>
          <Card>
            <CardContent>
              {favoriteCategories.length === 0 ? (
                <Typography color="text.secondary">Play quizzes to discover your favorites.</Typography>
              ) : (
                favoriteCategories.map(([name, count]) => (
                  <Box key={name}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={600}>{name}</Typography>
                      <Typography color="text.secondary">{count}</Typography>
                    </Stack>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
