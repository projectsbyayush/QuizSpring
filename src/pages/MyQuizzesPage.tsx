import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { deleteQuiz } from '../api/quizzes';
import { getErrorMessage } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Loading } from '../components/Feedback';
import { useMyQuizzesQuery } from '../hooks/useQuizzes';
import type { QuizFilters } from '../types';

export default function MyQuizzesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuizFilters>({
    search: '',
    categoryId: 'all',
    difficulty: 'all',
    sort: 'newest',
    page: 0,
    size: 10,
    includeDrafts: true,
  });
  const query = useMyQuizzesQuery(filters);
  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-quizzes'] }),
        queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['attempts'] }),
        queryClient.invalidateQueries({ queryKey: ['accuracy'] }),
      ]);
    },
  });

  const visibleRows = query.data?.content ?? [];

  const updateSearch = (value: string): void => {
    setSearch(value);
    setFilters((current) => ({ ...current, search: value, page: 0 }));
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h3" fontWeight={800}>
            My quizzes
          </Typography>
          <Typography color="text.secondary">Create, publish, and maintain your question sets.</Typography>
        </Box>
        <Button component={RouterLink} to="/quizzes/create" variant="contained">
          Create quiz
        </Button>
      </Stack>

      <TextField
        fullWidth
        placeholder="Search your quizzes…"
        value={search}
        onChange={(event) => updateSearch(event.target.value)}
        sx={{ mb: 3 }}
      />

      {deleteMutation.isError && (
        <Box sx={{ mb: 2 }}>
          <ErrorState error={deleteMutation.error} />
        </Box>
      )}
      {query.isLoading ? (
        <Loading label="Loading your quizzes…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : visibleRows.length === 0 ? (
        <Card>
          <EmptyState
            title="You have not created a quiz yet"
            body="Start with a topic you know well and share it with the community."
            action={
              <Button component={RouterLink} to="/quizzes/create" variant="contained">
                Create your first quiz
              </Button>
            }
          />
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {visibleRows.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box flexGrow={1} minWidth={0}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap mb={0.5}>
                    <Typography fontWeight={700} noWrap>
                      {quiz.title}
                    </Typography>
                    <Chip
                      size="small"
                      color={quiz.is_published ? 'success' : 'warning'}
                      label={quiz.is_published ? 'Published' : 'Draft'}
                    />
                    <Chip size="small" variant="outlined" label={quiz.difficulty} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {quiz.question_count} questions · {quiz.attempt_count} attempts ·{' '}
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </Typography>
                  {deleteMutation.isPending && (
                    <Typography variant="caption" color="text.secondary">
                      Updating…
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton component={RouterLink} to={`/quizzes/${quiz.id}/edit`} aria-label={`Edit ${quiz.title}`}>
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteId(quiz.id)} aria-label={`Delete ${quiz.title}`}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      {query.data && query.data.total_pages > 1 && (
        <Pagination
          count={query.data.total_pages}
          page={filters.page + 1}
          onChange={(_event, value) => setFilters((current) => ({ ...current, page: value - 1 }))}
          sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
        />
      )}
      {query.isError && (
        <Typography variant="caption" color="text.secondary">
          {getErrorMessage(query.error)}
        </Typography>
      )}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this quiz?"
        message="This permanently removes the quiz and its attempts. This action cannot be undone."
        confirmLabel="Delete quiz"
        destructive
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId, { onSettled: () => setDeleteId(null) });
        }}
      />
    </Box>
  );
}
