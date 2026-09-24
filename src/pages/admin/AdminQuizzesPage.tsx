import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
  Pagination,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { deleteAdminQuiz, setQuizPublished } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/Feedback';
import { useAdminQuizzesQuery } from '../../hooks/useAdmin';
import { useCategoriesQuery } from '../../hooks/useQuizzes';
import type { QuizSummary } from '../../types';

export default function AdminQuizzesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
  const categoriesQuery = useCategoriesQuery();
  const query = useAdminQuizzesQuery(search, categoryId, difficulty, page);
  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => setQuizPublished(id, published),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminQuiz,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Quizzes
          </Typography>
          <Typography color="text.secondary">Review publishing status and moderate content.</Typography>
        </Box>
        <Button component={RouterLink} to="/quizzes/create" variant="contained">
          New quiz
        </Button>
      </Stack>
      <TextField
        fullWidth
        placeholder="Search title…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        sx={{ mb: 2 }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          select
          label="Category"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="">All categories</MenuItem>
          {(categoriesQuery.data ?? []).map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Difficulty"
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: { sm: 150 }, width: { xs: '100%', sm: 'auto' } }}
        >
          <MenuItem value="all">All levels</MenuItem>
          <MenuItem value="Easy">Easy</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Hard">Hard</MenuItem>
        </TextField>
      </Stack>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          {(publishMutation.isError || deleteMutation.isError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(publishMutation.error ?? deleteMutation.error)}
            </Alert>
          )}
          <Card sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.content.length ? (
                  query.data.content.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <Typography fontWeight={600}>{quiz.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quiz.profiles?.username || quiz.id.slice(0, 8)}
                        </Typography>
                      </TableCell>
                      <TableCell>{quiz.categories?.name || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={quiz.difficulty} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={quiz.is_published}
                          disabled={publishMutation.isPending}
                          onChange={() => publishMutation.mutate({ id: quiz.id, published: !quiz.is_published })}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{new Date(quiz.created_at).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" component={RouterLink} to={`/quizzes/${quiz.id}`} variant="outlined">
                            View
                          </Button>
                          <Button
                            size="small"
                            component={RouterLink}
                            to={`/quizzes/${quiz.id}/edit`}
                            variant="outlined"
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={deleteMutation.isPending}
                            onClick={() => setDeleteTarget(quiz)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        No quizzes match these filters.
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this quiz?"
        message={`Delete ${deleteTarget?.title ?? 'this quiz'}? Its questions and attempt history will be removed.`}
        confirmLabel="Delete quiz"
        destructive
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      />
    </Box>
  );
}
