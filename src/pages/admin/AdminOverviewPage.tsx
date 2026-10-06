import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { ErrorState, Loading } from '../../components/Feedback';
import { AdminStatGrid, PanelCard, PanelEmpty, PanelRow } from '../../components/admin/AdminUi';
import { AdminPageHeader } from '../../components/admin/AdminPage';
import { useAdminStatsQuery } from '../../hooks/useAdmin';

export default function AdminOverviewPage() {
  const query = useAdminStatsQuery();

  if (query.isLoading) return <Loading label="Loading admin stats…" />;
  if (query.isError || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const stats = query.data;

  return (
    <Box>
      <AdminPageHeader
        title="Overview"
        description="Platform health and the latest activity across users, quizzes, and attempts."
      />

      <AdminStatGrid
        items={[
          { label: 'Users', value: stats.users, icon: <GroupOutlinedIcon fontSize="small" />, color: '#1976d2' },
          { label: 'Quizzes', value: stats.quizzes, icon: <QuizOutlinedIcon fontSize="small" />, color: '#7b1fa2' },
          {
            label: 'Categories',
            value: stats.categories,
            icon: <CategoryOutlinedIcon fontSize="small" />,
            color: '#00897b',
          },
          {
            label: 'Attempts',
            value: stats.attempts,
            icon: <HistoryOutlinedIcon fontSize="small" />,
            color: '#ed6c02',
          },
          {
            label: 'Active · 7d',
            value: stats.active_7d,
            hint: stats.users === 0 ? undefined : `${Math.round((stats.active_7d / stats.users) * 100)}% of users`,
            icon: <LocalFireDepartmentOutlinedIcon fontSize="small" />,
            color: '#c62828',
            progress: stats.users === 0 ? 0 : (stats.active_7d / stats.users) * 100,
          },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <PanelCard
          title="Recent quizzes"
          action={
            <Button component={RouterLink} to="/admin/quizzes" size="small">
              View all
            </Button>
          }
        >
          {stats.recent_quizzes.length === 0 ? (
            <PanelEmpty>No quizzes yet.</PanelEmpty>
          ) : (
            stats.recent_quizzes.map((quiz) => (
              <PanelRow
                key={quiz.id}
                primary={quiz.title}
                secondary={new Date(quiz.created_at).toLocaleDateString()}
                trailing={
                  <Button component={RouterLink} to={`/quizzes/${quiz.id}`} size="small">
                    Open
                  </Button>
                }
              />
            ))
          )}
        </PanelCard>

        <PanelCard
          title="Recent signups"
          action={
            <Button component={RouterLink} to="/admin/users" size="small">
              View all
            </Button>
          }
        >
          {stats.recent_signups.length === 0 ? (
            <PanelEmpty>No signups yet.</PanelEmpty>
          ) : (
            stats.recent_signups.map((signup) => (
              <PanelRow
                key={signup.id}
                primary={signup.username || signup.email}
                secondary={`Joined ${new Date(signup.created_at).toLocaleDateString()}`}
              />
            ))
          )}
        </PanelCard>

        <PanelCard
          title="Recent attempts"
          action={
            <Button component={RouterLink} to="/admin/attempts" size="small">
              View all
            </Button>
          }
        >
          {stats.recent_attempts.length === 0 ? (
            <PanelEmpty>No attempts yet.</PanelEmpty>
          ) : (
            stats.recent_attempts.map((attempt) => {
              const percentage = Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100);
              return (
                <PanelRow
                  key={attempt.id}
                  primary={`${attempt.score}/${attempt.total_questions} correct`}
                  secondary={new Date(attempt.completed_at).toLocaleString()}
                  trailing={
                    <Box
                      component="span"
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: percentage >= 80 ? 'success.main' : 'text.secondary',
                      }}
                    >
                      {percentage}%
                    </Box>
                  }
                />
              );
            })
          )}
        </PanelCard>
      </Box>

      <PanelCard title="Quick actions">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button component={RouterLink} to="/quizzes/create" size="small" variant="contained" startIcon={<AddIcon />}>
            New quiz
          </Button>
          <Button component={RouterLink} to="/admin/users" size="small" variant="outlined">
            Manage users
          </Button>
          <Button component={RouterLink} to="/admin/categories" size="small" variant="outlined">
            Categories
          </Button>
          <Button component={RouterLink} to="/admin/attempts" size="small" variant="outlined">
            Attempt log
          </Button>
        </Box>
      </PanelCard>
    </Box>
  );
}
