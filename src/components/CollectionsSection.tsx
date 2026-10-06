import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import QuizCard from './QuizCard';
import QuizCardSkeleton from './QuizCardSkeleton';
import { EmptyState, ErrorState } from './Feedback';
import { useOfficialCollections } from '../hooks/useCollections';

interface CollectionGroup {
  key: string;
  name: string;
  accent: string;
  quizCount: number;
  questions: number;
  previews: { id: string; title: string }[];
}

const accents = ['#1976d2', '#7b1fa2', '#00897b', '#ed6c02', '#c62828', '#5d4037'];

export default function CollectionsSection({ onPickCategory }: { onPickCategory: (categoryId: string) => void }) {
  const query = useOfficialCollections();
  const [activeKey, setActiveKey] = useState<string>('all');
  const [search, setSearch] = useState('');

  const all = useMemo(() => query.data ?? [], [query.data]);

  const groups = useMemo<CollectionGroup[]>(() => {
    const map = new Map<string, CollectionGroup>();
    for (const quiz of all) {
      const key = quiz.categories?.id ?? 'uncategorised';
      const existing = map.get(key);
      if (existing) {
        existing.quizCount += 1;
        existing.questions += quiz.question_count;
        if (existing.previews.length < 3) existing.previews.push({ id: quiz.id, title: quiz.title });
        continue;
      }
      map.set(key, {
        key,
        name: quiz.categories?.name ?? 'Other topics',
        accent: accents[map.size % accents.length],
        quizCount: 1,
        questions: quiz.question_count,
        previews: [{ id: quiz.id, title: quiz.title }],
      });
    }
    return [...map.values()].sort((a, b) => b.quizCount - a.quizCount);
  }, [all]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((quiz) => {
      if (activeKey !== 'all' && (quiz.categories?.id ?? 'uncategorised') !== activeKey) return false;
      if (!needle) return true;
      return quiz.title.toLowerCase().includes(needle);
    });
  }, [all, activeKey, search]);

  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        title="Could not load the platform library"
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <VerifiedOutlinedIcon color="primary" />
          <Typography variant="h5" fontWeight={800}>
            Platform library
          </Typography>
          <Chip size="small" color="primary" variant="outlined" label={`${all.length} inbuilt quizzes`} />
        </Stack>
        <Button
          component={RouterLink}
          to="/platform-quizzes"
          size="small"
          endIcon={<ArrowForwardIcon fontSize="small" />}
        >
          Open full library
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {query.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <QuizCardSkeleton key={index} />)
          : groups.map((group) => (
              <Paper
                key={group.key}
                variant="outlined"
                sx={{
                  p: 2,
                  borderTop: '3px solid',
                  borderTopColor: group.accent,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography fontWeight={800}>{group.name}</Typography>
                  <Chip size="small" variant="outlined" label={group.quizCount} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {group.questions} questions across {group.quizCount} {group.quizCount === 1 ? 'quiz' : 'quizzes'}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {group.previews.map((preview) => (
                    <Chip
                      key={preview.id}
                      size="small"
                      variant="outlined"
                      label={preview.title}
                      component={RouterLink}
                      to={`/quizzes/${preview.id}`}
                      clickable
                      sx={{ maxWidth: 190 }}
                    />
                  ))}
                </Stack>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    sx={{ fontWeight: 700, color: group.accent }}
                    onClick={() => setActiveKey(group.key)}
                  >
                    Filter list
                  </Button>
                  {group.key !== 'uncategorised' && (
                    <Button size="small" color="inherit" onClick={() => onPickCategory(group.key)}>
                      Open topic
                    </Button>
                  )}
                </Stack>
              </Paper>
            ))}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search platform quizzes…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          size="small"
          value={activeKey}
          onChange={(event) => setActiveKey(event.target.value)}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="all">All topics</MenuItem>
          {groups.map((group) => (
            <MenuItem key={group.key} value={group.key}>
              {group.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {visible.length === 0 ? (
        <EmptyState title="No platform quizzes match" body="Try another topic or clear the search." />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gridAutoRows: '1fr',
            gap: 2.5,
          }}
        >
          {visible.slice(0, 9).map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </Box>
      )}
    </Box>
  );
}
