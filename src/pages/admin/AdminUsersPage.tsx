import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import { updateUserBan, updateUserRole } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/Feedback';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminUsersQuery } from '../../hooks/useAdmin';
import type { Role, User } from '../../types';

type UserAction = { type: 'role' | 'ban'; user: User };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<UserAction | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const query = useAdminUsersQuery(search, role, status, page);
  const roleMutation = useMutation({
    mutationFn: ({ id, nextRole }: { id: string; nextRole: Role }) => updateUserRole(id, nextRole),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) => updateUserBan(id, banned),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const updateSearch = (value: string): void => {
    setSearch(value);
    setPage(0);
  };

  const renderUser = (user: User) => {
    const isCurrent = user.id === currentUser?.id;
    const mutationError = roleMutation.error ?? banMutation.error;
    return (
      <TableRow key={user.id}>
        <TableCell>
          <Typography fontWeight={600}>{user.username || user.email}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email} · {new Date(user.created_at).toLocaleDateString()}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip size="small" label={user.role} color={user.role === 'admin' ? 'primary' : 'default'} />
        </TableCell>
        <TableCell>{user.total_xp.toLocaleString()}</TableCell>
        <TableCell>{user.level}</TableCell>
        <TableCell>{user.streak}</TableCell>
        <TableCell>
          <Chip
            size="small"
            color={user.is_banned ? 'error' : 'success'}
            label={user.is_banned ? 'Banned' : 'Active'}
          />
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" variant="outlined" onClick={() => setDetailUser(user)}>
              View
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={isCurrent || roleMutation.isPending}
              onClick={() => setAction({ type: 'role', user })}
            >
              Make {user.role === 'admin' ? 'user' : 'admin'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color={user.is_banned ? 'success' : 'error'}
              disabled={isCurrent || banMutation.isPending}
              onClick={() => setAction({ type: 'ban', user })}
            >
              {user.is_banned ? 'Unban' : 'Ban'}
            </Button>
          </Stack>
          {mutationError && (
            <Typography variant="caption" color="error">
              {getErrorMessage(mutationError)}
            </Typography>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Users
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search username or email…"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="Role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as Role | 'all');
            setPage(0);
          }}
          sx={{ minWidth: { sm: 150 }, width: { xs: '100%', sm: 'auto' } }}
        >
          <MenuItem value="all">All roles</MenuItem>
          <MenuItem value="user">Users</MenuItem>
          <MenuItem value="admin">Admins</MenuItem>
        </TextField>
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as 'all' | 'active' | 'banned');
            setPage(0);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="banned">Banned</MenuItem>
        </TextField>
      </Stack>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          {(roleMutation.isError || banMutation.isError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(roleMutation.error ?? banMutation.error)}
            </Alert>
          )}
          <Card sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>XP</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Streak</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.content.length ? (
                  query.data.content.map(renderUser)
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        No users match these filters.
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
      <Dialog open={Boolean(detailUser)} onClose={() => setDetailUser(null)} fullWidth maxWidth="xs">
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          {detailUser && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Typography fontWeight={700}>{detailUser.username ?? detailUser.email}</Typography>
              <Typography variant="body2" color="text.secondary">
                {detailUser.email}
              </Typography>
              <Typography variant="body2">Role: {detailUser.role}</Typography>
              <Typography variant="body2">Total XP: {detailUser.total_xp.toLocaleString()}</Typography>
              <Typography variant="body2">Level: {detailUser.level}</Typography>
              <Typography variant="body2">Current streak: {detailUser.streak} days</Typography>
              <Typography variant="body2">Joined: {new Date(detailUser.created_at).toLocaleDateString()}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={Boolean(action)}
        title={
          action?.type === 'ban'
            ? action.user.is_banned
              ? 'Unban this user?'
              : 'Ban this user?'
            : 'Change this user role?'
        }
        message={
          action?.type === 'ban'
            ? action.user.is_banned
              ? 'This user will be able to sign in and use their account again.'
              : 'This user will be signed out and blocked from using the platform.'
            : `Change ${action?.user.username ?? action?.user.email ?? 'this user'} to ${
                action?.user.role === 'admin' ? 'USER' : 'ADMIN'
              }?`
        }
        confirmLabel={action?.type === 'ban' ? (action.user.is_banned ? 'Unban user' : 'Ban user') : 'Change role'}
        destructive={action?.type === 'ban' && !action.user.is_banned}
        busy={roleMutation.isPending || banMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (!action) return;
          if (action.type === 'ban') {
            banMutation.mutate(
              { id: action.user.id, banned: !action.user.is_banned },
              { onSettled: () => setAction(null) },
            );
          } else {
            roleMutation.mutate(
              { id: action.user.id, nextRole: action.user.role === 'admin' ? 'user' : 'admin' },
              { onSettled: () => setAction(null) },
            );
          }
        }}
      />
    </Box>
  );
}
