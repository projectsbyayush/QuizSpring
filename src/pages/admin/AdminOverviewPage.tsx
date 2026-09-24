import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { ErrorState, Loading } from '../../components/Feedback';
import StatCard from '../../components/StatCard';
import { useAdminStatsQuery } from '../../hooks/useAdmin';

export default function AdminOverviewPage() {
  const query = useAdminStatsQuery();
  if (query.isLoading) return <Loading label="Loading admin stats…" />;
  if (query.isError || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const stats = query.data;

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Overview
      </Typography>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2.5, mb: 3 }}
      >
        <StatCard label="Total users" value={stats.users} />
        <StatCard label="Total quizzes" value={stats.quizzes} />
        <StatCard label="Categories" value={stats.categories} />
        <StatCard label="Total attempts" value={stats.attempts} />
        <StatCard label="Active in 7 days" value={stats.active_7d} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <Card>
          <CardContent>
            <Typography fontWeight={800} gutterBottom>
              Recently created quizzes
            </Typography>
            {stats.recent_quizzes.length === 0 ? (
              <Typography color="text.secondary">No quizzes yet.</Typography>
            ) : (
              stats.recent_quizzes.map((quiz) => (
                <Box key={quiz.id}>
                  <Stack direction="row" justifyContent="space-between" gap={2} py={1}>
                    <Typography>{quiz.title}</Typography>
                    <Typography color="text.secondary" variant="body2" whiteSpace="nowrap">
                      {new Date(quiz.created_at).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Divider />
                </Box>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography fontWeight={800} gutterBottom>
              Recent signups
            </Typography>
            {stats.recent_signups.length === 0 ? (
              <Typography color="text.secondary">No signups yet.</Typography>
            ) : (
              stats.recent_signups.map((signup) => (
                <Box key={signup.id}>
                  <Stack direction="row" justifyContent="space-between" gap={2} py={1}>
                    <Typography>{signup.username}</Typography>
                    <Typography color="text.secondary" variant="body2" whiteSpace="nowrap">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </Typography>
                  </Stack>
                  <Divider />
                </Box>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography fontWeight={800} gutterBottom>
              Recent attempts
            </Typography>
            {stats.recent_attempts.length === 0 ? (
              <Typography color="text.secondary">No attempts yet.</Typography>
            ) : (
              stats.recent_attempts.map((attempt) => (
                <Box key={attempt.id}>
                  <Stack direction="row" justifyContent="space-between" gap={2} py={1}>
                    <Typography>
                      {attempt.score}/{attempt.total_questions} correct
                    </Typography>
                    <Typography color="text.secondary" variant="body2" whiteSpace="nowrap">
                      {new Date(attempt.completed_at).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Divider />
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
