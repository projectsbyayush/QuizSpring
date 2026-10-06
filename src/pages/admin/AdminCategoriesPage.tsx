import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { createAdminCategory, deleteAdminCategory, updateAdminCategory } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/Feedback';
import RowActionsMenu from '../../components/admin/RowActionsMenu';
import { AdminPage } from '../../components/admin/AdminPage';
import { useAdminCategoriesQuery } from '../../hooks/useAdmin';
import type { Category, CategoryInput } from '../../types';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const query = useAdminCategoriesQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const closeDialog = (): void => {
    setOpen(false);
    setEditing(null);
  };

  const openNew = (): void => {
    setEditing(null);
    setName('');
    setDescription('');
    setOpen(true);
  };

  const openEdit = (category: Category): void => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? '');
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editing ? updateAdminCategory(editing.id, input) : createAdminCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeDialog();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const mutationError = saveMutation.error ?? deleteMutation.error;
  const categories = query.data ?? [];

  const save = (): void => {
    if (!name.trim()) return;
    saveMutation.mutate({ name: name.trim(), description: description.trim() || null, icon: null });
  };

  return (
    <AdminPage
      title="Categories"
      description="Organise the catalogue. Categories used by quizzes cannot be deleted."
      actions={
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}>
          New category
        </Button>
      }
      resultSummary={
        query.isFetching ? 'Updating…' : `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`
      }
    >
      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(mutationError)}
        </Alert>
      )}

      {query.isLoading ? (
        <Loading label="Loading categories…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <TableContainer
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, backgroundColor: 'background.paper' }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
                      No categories yet. Create one to organise your quizzes.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{category.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 320 }}>
                        {category.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        label={`Actions for ${category.name}`}
                        actions={[
                          {
                            label: 'Edit',
                            icon: <EditOutlinedIcon fontSize="small" />,
                            onSelect: () => openEdit(category),
                          },
                          {
                            label: 'Delete',
                            icon: <DeleteOutlineIcon fontSize="small" />,
                            color: 'error',
                            disabled: deleteMutation.isPending,
                            onSelect: () => setDeleteTarget(category),
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
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`${deleteTarget?.name ?? 'This category'} will be removed. Categories in use by a quiz cannot be deleted.`}
        confirmLabel="Delete category"
        destructive
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      />

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!name.trim() || saveMutation.isPending} onClick={save}>
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPage>
  );
}
