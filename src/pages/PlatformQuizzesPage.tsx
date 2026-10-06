import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, MenuItem, Pagination, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import QuizCard from '../components/QuizCard';
import QuizCardSkeleton from '../components/QuizCardSkeleton';
import { EmptyState, ErrorState } from '../components/Feedback';
import { useOfficialCollections } from '../hooks/useCollections';

const PER_PAGE = 12;
const accents = ['#1976d2', '#7b1fa2', '#00897b', '#ed6c02', '#c62828', '#5d4037'];

export default function PlatformQuizzesPage() {
  const query = useOfficialCollections();
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const all = useMemo(() => query.data ?? [], [query.data]);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; accent: string; count: number }>();
    for (const quiz of all) {
      const id = quiz.categories?.id ?? 'uncategorised';
      const existing = map.get(id);
      if (existing) existing.count += 1;
      else
        map.set(id, {
          id,
          name: quiz.categories?.name ?? 'Other topics',
          accent: accents[map.size % accents.length],
          count: 1,
        });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [all]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((quiz) => {
      if (categoryId !== 'all' && (quiz.categories?.id ?? 'uncategorised') !== categoryId) return false;
      if (!needle) return true;
      return quiz.title.toLowerCase().includes(needle) || (quiz.description ?? '').toLowerCase().includes(needle);
    });
  }, [all, categoryId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  const totalQuestions = filtered.reduce((sum, quiz) => sum + quiz.question_count, 0);

  const reset = (fn: () => void): void => {
    fn();
    setPage(0);
  };

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
    <Box>
      <Button component={RouterLink} to="/quizzes" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 2 }}>
        Back to explore
      </Button>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <VerifiedOutlinedIcon color="primary" />
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
          Platform quizzes
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Quizzes built into QuizSpring, organised into curated collections. No account authoring required.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {query.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <QuizCardSkeleton key={index} />)
          : categories.map((category) => (
              <Paper
                key={category.id}
                variant="outlined"
                onClick={() => reset(() => setCategoryId(category.id))}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderTop: '3px solid',
                  borderTopColor: category.accent,
                  borderColor: categoryId === category.id ? category.accent : 'divider',
                  transition: 'transform .15s ease',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={800} noWrap>
                    {category.name}
                  </Typography>
                  <Chip size="small" variant="outlined" label={category.count} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {categoryId === category.id ? 'Showing this collection' : 'View collection'}
                </Typography>
              </Paper>
            ))}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search platform quizzes…"
          value={search}
          onChange={(event) => reset(() => setSearch(event.target.value))}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          size="small"
          value={categoryId}
          onChange={(event) => reset(() => setCategoryId(event.target.value))}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All collections ({all.length})</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name} ({category.count})
            </MenuItem>
          ))}
        </TextField>
        {categoryId !== 'all' && (
          <Button size="small" color="inherit" onClick={() => reset(() => setCategoryId('all'))}>
            Clear
          </Button>
        )}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'} · {totalQuestions} questions
      </Typography>

      {visible.length === 0 ? (
        <EmptyState
          title="No platform quizzes match"
          body="Choose another collection or clear your search."
          action={
            <Button
              variant="contained"
              onClick={() => {
                setSearch('');
                setCategoryId('all');
                setPage(0);
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gridAutoRows: '1fr',
              gap: 2.5,
            }}
          >
            {visible.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </Box>
          {totalPages > 1 && (
            <Stack sx={{ mt: 3 }} alignItems="center">
              <Pagination
                count={totalPages}
                page={safePage + 1}
                onChange={(_event, value) => setPage(value - 1)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
