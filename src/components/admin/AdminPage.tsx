import type { ChangeEvent, ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export function AdminPage({
  title,
  description,
  actions,
  resultSummary,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  resultSummary?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <AdminPageHeader title={title} description={description} actions={actions} />
      {resultSummary && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -2, mb: 2 }}>
          {resultSummary}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, alignItems: { sm: 'center' } }}>
      {children}
    </Stack>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Box
      component="input"
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      sx={(theme) => ({
        flex: 1,
        minWidth: 0,
        px: 2,
        py: 1.1,
        font: 'inherit',
        fontSize: 14,
        color: 'text.primary',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        outline: 'none',
        '&::placeholder': { color: 'text.secondary', opacity: 1 },
        '&:focus': { borderColor: theme.palette.primary.main },
      })}
    />
  );
}
