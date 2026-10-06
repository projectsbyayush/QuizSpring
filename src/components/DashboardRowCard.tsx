import type { ReactNode } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface DashboardRowCardProps {
  accent: string;
  badgeBackground: string;
  badgeColor: string;
  badge: ReactNode;
  title: ReactNode;
  details: string;
  status: ReactNode;
  action: ReactNode;
}

export default function DashboardRowCard({
  accent,
  badgeBackground,
  badgeColor,
  badge,
  title,
  details,
  status,
  action,
}: DashboardRowCardProps) {
  return (
    <Card sx={{ height: '100%', borderLeft: '4px solid', borderColor: accent }}>
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          minHeight: 88,
          p: 2,
          '&:last-child': { paddingBottom: 2 },
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1.5,
            backgroundColor: badgeBackground,
            color: badgeColor,
          }}
        >
          {badge}
        </Box>
        <Box flexGrow={1} minWidth={0}>
          <Box sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap>
            {details}
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            rowGap: 1,
            columnGap: 1,
          }}
        >
          {status}
          {action}
        </Box>
      </CardContent>
    </Card>
  );
}
