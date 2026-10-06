import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import type { User } from '../../types';
import { xpProgress } from '../../utils/xp';

export default function UserDetailDialog({
  user,
  onClose,
  attempts,
}: {
  user: User | null;
  onClose: () => void;
  attempts?: number;
}) {
  const progress = user ? xpProgress(user.total_xp) : null;

  return (
    <Dialog open={Boolean(user)} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>Account details</DialogTitle>
      <DialogContent>
        {user && (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                {(user.username || user.email).charAt(0).toUpperCase()}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} noWrap>
                  {user.username || user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={user.role === 'admin' ? 'Admin' : 'User'}
                color={user.role === 'admin' ? 'primary' : 'default'}
              />
              <Chip
                size="small"
                label={user.is_banned ? 'Banned' : 'Active'}
                color={user.is_banned ? 'error' : 'success'}
                variant="outlined"
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.5,
                p: 2,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Detail label="Total XP" value={user.total_xp.toLocaleString()} />
              <Detail label="Level" value={String(user.level)} />
              <Detail label="Streak" value={`${user.streak} days`} />
              <Detail label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
              {attempts !== undefined && <Detail label="Attempts" value={String(attempts)} />}
            </Box>

            {progress && user.total_xp > 0 && (
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress to level {user.level + 1}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {progress.current} / {progress.needed} XP
                  </Typography>
                </Stack>
                <Box sx={{ height: 6, borderRadius: 99, backgroundColor: 'action.hover', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${progress.pct}%`,
                      height: '100%',
                      borderRadius: 99,
                      backgroundColor: 'primary.main',
                    }}
                  />
                </Box>
              </Box>
            )}

            {(user.longest_streak ?? 0) > 0 && (
              <>
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Longest streak: {user.longest_streak} days
                </Typography>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  );
}
