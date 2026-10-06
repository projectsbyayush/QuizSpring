import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Chip, List, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { useAdminStatsQuery } from '../../hooks/useAdmin';

export function AdminNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const items = [
    { to: '/admin', label: 'Overview', icon: <DashboardOutlinedIcon fontSize="small" /> },
    { to: '/admin/users', label: 'Users', icon: <PeopleOutlinedIcon fontSize="small" /> },
    { to: '/admin/quizzes', label: 'Quizzes', icon: <QuizOutlinedIcon fontSize="small" /> },
    { to: '/admin/categories', label: 'Categories', icon: <CategoryOutlinedIcon fontSize="small" /> },
    { to: '/admin/attempts', label: 'Attempts', icon: <HistoryOutlinedIcon fontSize="small" /> },
  ];

  return (
    <Box>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em' }}>
          Administration
        </Typography>
      </Box>
      <List disablePadding sx={{ px: 1 }}>
        {items.map((item) => {
          const active = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={active}
              onClick={onNavigate}
              sx={{
                borderRadius: 2.5,
                mb: 0.25,
                gap: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { backgroundColor: 'primary.main' },
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: active ? 'inherit' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ px: 2, py: 2 }}>
        <ListItemButton
          component={RouterLink}
          to="/dashboard"
          onClick={onNavigate}
          sx={{ borderRadius: 2.5, gap: 1.5, color: 'text.secondary' }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
            <ArrowBackIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Back to app" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export function AdminContextSummary() {
  const stats = useAdminStatsQuery();
  if (stats.isLoading || !stats.data) return null;
  const data = stats.data;
  return (
    <Paper variant="outlined" sx={{ borderRadius: 4, p: 2 }}>
      <Stack spacing={1.25}>
        <SummaryLine label="Users" value={data.users} />
        <SummaryLine label="Quizzes" value={data.quizzes} />
        <SummaryLine label="Attempts" value={data.attempts} />
        <SummaryLine label="Active · 7d" value={data.active_7d} />
      </Stack>
    </Paper>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Chip size="small" variant="outlined" label={value} />
    </Stack>
  );
}
