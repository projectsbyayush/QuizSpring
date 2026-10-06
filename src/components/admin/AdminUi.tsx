import { Box, Card, Chip, LinearProgress, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface AdminStat {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  color?: string;
  progress?: number;
}

export function AdminStatGrid({ items }: { items: AdminStat[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
        gap: 2,
        mb: 3,
      }}
    >
      {items.map((item) => (
        <AdminStatCard key={item.label} {...item} />
      ))}
    </Box>
  );
}

function AdminStatCard({ label, value, hint, icon, color = 'primary.main', progress }: AdminStat) {
  return (
    <Card sx={{ height: '100%', borderTop: '3px solid', borderTopColor: color }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
            {label.toUpperCase()}
          </Typography>
          {icon && <Box sx={{ color, display: 'flex' }}>{icon}</Box>}
        </Box>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" lineHeight={1.1}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress))}
            sx={{ mt: 'auto', pt: 0.5, borderRadius: 99, height: 6 }}
          />
        )}
      </Box>
    </Card>
  );
}

export function PanelCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', height: '100%' }}>
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography fontWeight={700}>{title}</Typography>
        {action}
      </Box>
      <Box sx={{ p: 1 }}>{children}</Box>
    </Paper>
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" variant="body2" textAlign="center" sx={{ py: 5 }}>
      {children}
    </Typography>
  );
}

export function PanelRow({
  primary,
  secondary,
  trailing,
}: {
  primary: string;
  secondary: string;
  trailing?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 1.5,
        py: 1.25,
        borderRadius: 1,
        '&:hover': { backgroundColor: 'action.hover' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {primary}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {secondary}
        </Typography>
      </Box>
      {trailing && <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>{trailing}</Box>}
    </Box>
  );
}

export function ScoreChip({ percentage }: { percentage: number }) {
  const color = percentage >= 80 ? 'success' : percentage >= 50 ? 'warning' : 'default';
  return <Chip size="small" variant="outlined" color={color} label={`${percentage}%`} />;
}
