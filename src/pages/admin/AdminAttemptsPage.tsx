import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ErrorState, Loading } from '../../components/Feedback';
import RowActionsMenu from '../../components/admin/RowActionsMenu';
import { AdminPage, AdminToolbar, SearchField } from '../../components/admin/AdminPage';
import { ScoreChip } from '../../components/admin/AdminUi';
import { useAdminAttemptsQuery } from '../../hooks/useAdmin';
import { formatSeconds } from '../../utils/xp';
import type { AdminAttemptFilters } from '../../types';

const emptyFilters: AdminAttemptFilters = { search: '', userId: '', quizId: '', from: '', to: '' };

export default function AdminAttemptsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AdminAttemptFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const query = useAdminAttemptsQuery(filters, page);

  const update = (patch: Partial<AdminAttemptFilters>): void => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  };

  const activeAdvanced = Boolean(filters.userId || filters.quizId || filters.from || filters.to);
  const attempts = query.data?.content ?? [];
  const total = query.data?.total_elements ?? 0;

  const clearAll = (): void => {
    setFilters(emptyFilters);
    setPage(0);
  };

  return (
    <AdminPage
      title="Attempts"
      description="Completed attempts across the platform."
      actions={
        activeAdvanced ? (
          <Button variant="outlined" size="small" onClick={clearAll}>
            Clear filters
          </Button>
        ) : undefined
      }
      resultSummary={query.isFetching ? 'Updating…' : `${total} ${total === 1 ? 'attempt' : 'attempts'}`}
    >
      <AdminToolbar>
        <SearchField
          value={filters.search}
          onChange={(value) => update({ search: value })}
          placeholder="Search user or quiz"
        />
        <Button
          variant={activeAdvanced ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setShowAdvanced((current) => !current)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? 'Hide filters' : 'More filters'}
        </Button>
      </AdminToolbar>

      {showAdvanced && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 1.5,
            mb: 2,
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 4,
          }}
        >
          <TextField
            size="small"
            label="User ID"
            value={filters.userId}
            onChange={(event) => update({ userId: event.target.value })}
          />
          <TextField
            size="small"
            label="Quiz ID"
            value={filters.quizId}
            onChange={(event) => update({ quizId: event.target.value })}
          />
          <TextField
            size="small"
            label="From"
            type="date"
            value={filters.from}
            onChange={(event) => update({ from: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filters.to}
            onChange={(event) => update({ to: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}

      {query.isLoading ? (
        <Loading label="Loading attempts…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <TableContainer
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 4,
              backgroundColor: 'background.paper',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quiz</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">XP</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell align="right">Time</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
                        No attempts match these filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => {
                    const percentage = Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100);
                    return (
                      <TableRow key={attempt.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} noWrap sx={{ maxWidth: 240 }}>
                            {attempt.quiz?.title ?? 'Deleted quiz'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            User {attempt.user_id.slice(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip size="small" variant="outlined" label={`${attempt.score}/${attempt.total_questions}`} />
                        </TableCell>
                        <TableCell align="right">+{attempt.xp_earned}</TableCell>
                        <TableCell>
                          <ScoreChip percentage={percentage} />
                        </TableCell>
                        <TableCell align="right">{formatSeconds(attempt.time_taken)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" whiteSpace="nowrap">
                            {new Date(attempt.completed_at).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <RowActionsMenu
                            label={`Actions for attempt on ${attempt.quiz?.title ?? 'quiz'}`}
                            actions={[
                              {
                                label: 'View result',
                                onSelect: () => navigate(`/attempts/${attempt.id}`),
                                disabled: !attempt.quiz,
                              },
                              {
                                label: 'Open quiz',
                                onSelect: () => navigate(`/quizzes/${attempt.quiz_id}`),
                                disabled: !attempt.quiz,
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {query.data && query.data.total_pages > 1 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Page {page + 1} of {query.data.total_pages}
              </Typography>
              <Pagination
                count={query.data.total_pages}
                page={page + 1}
                onChange={(_event, value) => setPage(value - 1)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Need to review a specific player? Use their user ID in the advanced filters.{' '}
          <Typography
            component={RouterLink}
            to="/admin/users"
            variant="caption"
            sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
          >
            Browse users
          </Typography>
        </Typography>
      </Box>
    </AdminPage>
  );
}
