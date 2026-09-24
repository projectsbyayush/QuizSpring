import type { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../api/client';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      alignItems="center"
      justifyContent="center"
      minHeight={240}
      py={6}
    >
      <CircularProgress size={32} />
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
    </Box>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <Box textAlign="center" py={7} px={3} m="auto">
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      {body && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {body}
        </Typography>
      )}
      {action && <Box mt={2.5}>{action}</Box>}
    </Box>
  );
}

export function ErrorState({
  error,
  title = 'We could not load this content',
  onRetry,
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
      sx={{ alignItems: 'center' }}
    >
      <Stack spacing={0.25}>
        <Typography fontWeight={700}>{title}</Typography>
        <Typography variant="body2">{getErrorMessage(error)}</Typography>
      </Stack>
    </Alert>
  );
}
