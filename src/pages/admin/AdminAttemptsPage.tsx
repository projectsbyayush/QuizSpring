import { useState } from 'react';
import {
  Box,
  Card,
  Chip,
  InputAdornment,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ErrorState, Loading } from '../../components/Feedback';
import { useAdminAttemptsQuery } from '../../hooks/useAdmin';
import { formatSeconds } from '../../utils/xp';
import type { AdminAttemptFilters } from '../../types';

const emptyFilters: AdminAttemptFilters = { search: '', userId: '', quizId: '', from: '', to: '' };

export default function AdminAttemptsPage() {
  const [filters, setFilters] = useState<AdminAttemptFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const query = useAdminAttemptsQuery(filters, page);
  const update = (patch: Partial<AdminAttemptFilters>): void => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Attempts
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Review completed attempts across the platform.
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search user or quiz…"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="User ID"
          value={filters.userId}
          onChange={(event) => update({ userId: event.target.value })}
        />
        <TextField
          label="Quiz ID"
          value={filters.quizId}
          onChange={(event) => update({ quizId: event.target.value })}
        />
        <TextField
          label="From"
          type="date"
          value={filters.from}
          onChange={(event) => update({ from: event.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          value={filters.to}
          onChange={(event) => update({ to: event.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <Card sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Quiz</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>XP</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.content.length ? (
                  query.data.content.map((attempt) => {
                    const percentage = Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100);
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <Typography variant="body2">{attempt.user_id.slice(0, 8)}</Typography>
                        </TableCell>
                        <TableCell>{attempt.quiz?.title ?? '—'}</TableCell>
                        <TableCell>
                          {attempt.score}/{attempt.total_questions}
                        </TableCell>
                        <TableCell>+{attempt.xp_earned}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`${percentage}%`}
                            color={percentage === 100 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{formatSeconds(attempt.time_taken)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{new Date(attempt.completed_at).toLocaleString()}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        No attempts match these filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          {query.data && query.data.total_pages > 1 && (
            <Pagination
              count={query.data.total_pages}
              page={page + 1}
              onChange={(_event, value) => setPage(value - 1)}
              sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
            />
          )}
        </>
      )}
    </Box>
  );
}
