import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Chip,
  MenuItem,
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
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { updateUserBan, updateUserRole } from '../../api/admin';
import { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/Feedback';
import RowActionsMenu from '../../components/admin/RowActionsMenu';
import { AdminPage, AdminToolbar, SearchField } from '../../components/admin/AdminPage';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminUsersQuery } from '../../hooks/useAdmin';
import type { Role, User } from '../../types';
import UserDetailDialog from './UserDetailDialog';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) => updateUserBan(id, banned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const error = roleMutation.error ?? banMutation.error;

  const updateSearch = (value: string): void => {
    setSearch(value);
    setPage(0);
  };

  const users = query.data?.content ?? [];
  const total = query.data?.total_elements ?? 0;

  return (
    <AdminPage
      title="Users"
      description="Review accounts, adjust roles, and moderate access."
      resultSummary={query.isFetching ? 'Updating…' : `${total} ${total === 1 ? 'account' : 'accounts'}`}
    >
      <AdminToolbar>
        <SearchField value={search} onChange={updateSearch} placeholder="Search username or email" />
        <TextField
          select
          size="small"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as Role | 'all');
            setPage(0);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All roles</MenuItem>
          <MenuItem value="user">Users</MenuItem>
          <MenuItem value="admin">Admins</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
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
      </AdminToolbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(error)}
        </Alert>
      )}

      {query.isLoading ? (
        <Loading label="Loading users…" />
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
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">XP</TableCell>
                  <TableCell align="right">Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
                        No users match these filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((row) => {
                    const isSelf = row.id === currentUser?.id;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                                bgcolor: row.is_banned ? 'error.light' : 'primary.main',
                                color: row.is_banned ? 'error.contrastText' : 'primary.contrastText',
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {(row.username || row.email).charAt(0).toUpperCase()}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography fontWeight={600} noWrap>
                                  {row.username || row.email}
                                </Typography>
                                {isSelf && <Chip size="small" label="You" variant="outlined" sx={{ height: 20 }} />}
                              </Stack>
                              <Typography variant="caption" color="text.secondary" noWrap component="div">
                                {row.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.role === 'admin' ? 'Admin' : 'User'}
                            color={row.role === 'admin' ? 'primary' : 'default'}
                            variant={row.role === 'admin' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">{row.total_xp.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.level}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.is_banned ? 'Banned' : 'Active'}
                            color={row.is_banned ? 'error' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <RowActionsMenu
                            label={`Actions for ${row.username || row.email}`}
                            actions={[
                              {
                                label: 'View details',
                                icon: <VisibilityOutlinedIcon fontSize="small" />,
                                onSelect: () => setDetailUser(row),
                              },
                              {
                                label: `Make ${row.role === 'admin' ? 'user' : 'admin'}`,
                                icon: <ShieldOutlinedIcon fontSize="small" />,
                                disabled: isSelf || roleMutation.isPending,
                                onSelect: () => setAction({ type: 'role', user: row }),
                              },
                              {
                                label: row.is_banned ? 'Unban user' : 'Ban user',
                                icon: row.is_banned ? (
                                  <CheckCircleOutlineIcon fontSize="small" />
                                ) : (
                                  <BlockOutlinedIcon fontSize="small" />
                                ),
                                color: row.is_banned ? 'success' : 'error',
                                disabled: isSelf || banMutation.isPending,
                                onSelect: () => setAction({ type: 'ban', user: row }),
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

      <UserDetailDialog user={detailUser} onClose={() => setDetailUser(null)} />

      <ConfirmDialog
        open={Boolean(action) && action?.type === 'ban'}
        title={action && action.user.is_banned ? 'Unban this user?' : 'Ban this user?'}
        message={
          action
            ? `${action.user.username || action.user.email} ${
                action.user.is_banned
                  ? 'will be able to sign in and use their account again.'
                  : 'will be signed out and blocked from using the platform.'
              }`
            : ''
        }
        confirmLabel={action && action.user.is_banned ? 'Unban user' : 'Ban user'}
        destructive={Boolean(action) && !action?.user.is_banned}
        busy={banMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (!action) return;
          banMutation.mutate(
            { id: action.user.id, banned: !action.user.is_banned },
            { onSettled: () => setAction(null) },
          );
        }}
      />
      <ConfirmDialog
        open={Boolean(action) && action?.type === 'role'}
        title="Change this role?"
        message={`${action?.user.username || action?.user.email} will become ${
          action?.user.role === 'admin' ? 'a standard user' : 'an admin'
        }.`}
        confirmLabel="Change role"
        busy={roleMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (!action) return;
          roleMutation.mutate(
            { id: action.user.id, nextRole: action.user.role === 'admin' ? 'user' : 'admin' },
            { onSettled: () => setAction(null) },
          );
        }}
      />
    </AdminPage>
  );
}
