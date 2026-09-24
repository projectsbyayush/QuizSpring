import type { ReactNode } from 'react';
import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material';

export default function StatCard({
  label,
  value,
  sub,
  icon,
  progress,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  progress?: number;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} gap={1}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
          {value}
        </Typography>
        {sub && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {sub}
          </Typography>
        )}
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress))}
            sx={{ mt: 2, borderRadius: 99, height: 8 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
