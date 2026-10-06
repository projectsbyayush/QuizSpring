import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

export default function QuizCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: 1.5 }} />
          <Skeleton variant="rounded" width={64} height={24} sx={{ borderRadius: 1.5 }} />
        </Stack>
        <Skeleton variant="text" width="80%" height={28} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="70%" />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="text" width="55%" />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width="100%" height={34} sx={{ borderRadius: 1.5 }} />
          <Skeleton variant="rounded" width="100%" height={34} sx={{ borderRadius: 1.5 }} />
        </Stack>
      </CardContent>
    </Card>
  );
}
