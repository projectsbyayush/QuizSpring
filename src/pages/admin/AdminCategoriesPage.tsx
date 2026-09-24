import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { createAdminCategory, deleteAdminCategory, updateAdminCategory } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/Feedback';
import { useAdminCategoriesQuery } from '../../hooks/useAdmin';
import type { Category, CategoryInput } from '../../types';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const query = useAdminCategoriesQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const closeDialog = (): void => {
    setOpen(false);
    setEditing(null);
  };

  const openNew = (): void => {
    setEditing(null);
    setName('');
    setDescription('');
    setIcon('');
    setOpen(true);
  };

  const openEdit = (category: Category): void => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? '');
    setIcon(category.icon ?? '');
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editing ? updateAdminCategory(editing.id, input) : createAdminCategory(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeDialog();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const save = (): void => {
    if (!name.trim()) return;
    saveMutation.mutate({ name: name.trim(), description: description.trim() || null, icon: icon.trim() || null });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" fontWeight={800}>
          Categories
        </Typography>
        <Button variant="contained" onClick={openNew}>
          New category
        </Button>
      </Stack>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Card sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Icon</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.data?.length ? (
                query.data.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.icon}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{category.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`}>
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => setDeleteTarget(category)}
                        aria-label={`Delete ${category.name}`}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                      No categories yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
      {(saveMutation.isError || deleteMutation.isError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {getErrorMessage(saveMutation.error ?? deleteMutation.error)}
        </Alert>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`Delete ${deleteTarget?.name ?? 'this category'}? Categories used by quizzes cannot be deleted.`}
        confirmLabel="Delete category"
        destructive
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      />
      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} fullWidth required />
            <TextField
              label="Icon (optional short label)"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              fullWidth
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
    </Box>
  );
}
