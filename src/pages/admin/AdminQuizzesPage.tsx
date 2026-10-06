import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Pagination,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { deleteAdminQuiz, setQuizPublished } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/Feedback';
import RowActionsMenu from '../../components/admin/RowActionsMenu';
import { AdminPage, AdminToolbar, SearchField } from '../../components/admin/AdminPage';
import { useAdminQuizzesQuery } from '../../hooks/useAdmin';
import { useCategoriesQuery } from '../../hooks/useQuizzes';
import type { QuizSummary } from '../../types';

type PublishedFilter = 'all' | 'published' | 'draft';

export default function AdminQuizzesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [published, setPublished] = useState<PublishedFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);

  const categoriesQuery = useCategoriesQuery();
  const query = useAdminQuizzesQuery(search, categoryId, difficulty, published, page);

  const publishMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => setQuizPublished(id, next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminQuiz,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  const mutationError = publishMutation.error ?? deleteMutation.error;
  const quizzes = query.data?.content ?? [];
  const total = query.data?.total_elements ?? 0;

  const updateSearch = (value: string): void => {
    setSearch(value);
    setPage(0);
  };

  return (
    <AdminPage
      title="Quizzes"
      description="Review publishing status and moderate content."
      actions={
        <Button component={RouterLink} to="/quizzes/create" variant="contained" size="small" startIcon={<AddIcon />}>
          New quiz
        </Button>
      }
      resultSummary={query.isFetching ? 'Updating…' : `${total} ${total === 1 ? 'quiz' : 'quizzes'}`}
    >
      <AdminToolbar>
        <SearchField value={search} onChange={updateSearch} placeholder="Search quiz titles" />
        <TextField
          select
          size="small"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 165 }}
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
          size="small"
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 135 }}
        >
          <MenuItem value="all">All levels</MenuItem>
          <MenuItem value="Easy">Easy</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Hard">Hard</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          value={published}
          onChange={(event) => {
            setPublished(event.target.value as PublishedFilter);
            setPage(0);
          }}
          sx={{ minWidth: 135 }}
        >
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="draft">Drafts</MenuItem>
        </TextField>
      </AdminToolbar>

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(mutationError)}
        </Alert>
      )}

      {query.isLoading ? (
        <Loading label="Loading quizzes…" />
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
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell align="right">Questions</TableCell>
                  <TableCell align="right">Attempts</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizzes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
                        No quizzes match these filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quizzes.map((quiz) => (
                    <TableRow key={quiz.id} hover>
                      <TableCell>
                        <Typography fontWeight={600} noWrap sx={{ maxWidth: 280 }}>
                          {quiz.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quiz.profiles?.username || 'Unknown author'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
                          {quiz.categories?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={quiz.difficulty} />
                      </TableCell>
                      <TableCell align="right">{quiz.question_count}</TableCell>
                      <TableCell align="right">{quiz.attempt_count.toLocaleString()}</TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={quiz.is_published}
                          disabled={publishMutation.isPending}
                          onChange={() => publishMutation.mutate({ id: quiz.id, next: !quiz.is_published })}
                          inputProps={{ 'aria-label': `Toggle publishing for ${quiz.title}` }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <RowActionsMenu
                          label={`Actions for ${quiz.title}`}
                          actions={[
                            {
                              label: 'View',
                              icon: <VisibilityOutlinedIcon fontSize="small" />,
                              onSelect: () => navigate(`/quizzes/${quiz.id}`),
                            },
                            {
                              label: 'Edit',
                              icon: <EditOutlinedIcon fontSize="small" />,
                              onSelect: () => navigate(`/quizzes/${quiz.id}/edit`),
                            },
                            {
                              label: 'Delete',
                              icon: <DeleteOutlineIcon fontSize="small" />,
                              color: 'error',
                              disabled: deleteMutation.isPending,
                              onSelect: () => setDeleteTarget(quiz),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this quiz?"
        message={`${deleteTarget?.title ?? 'This quiz'} and its attempt history will be permanently removed.`}
        confirmLabel="Delete quiz"
        destructive
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      />
    </AdminPage>
  );
}
