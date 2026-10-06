import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/Feedback';
import QuizCard from '../components/QuizCard';
import { useCategoriesQuery, useQuizListQuery } from '../hooks/useQuizzes';
import type { Difficulty, QuizFilters } from '../types';

const initialFilters: QuizFilters = {
  search: '',
  categoryId: 'all',
  difficulty: 'all',
  sort: 'newest',
  page: 0,
  size: 9,
};

export default function QuizzesPage() {
  const [filters, setFilters] = useState<QuizFilters>(initialFilters);
  const categoriesQuery = useCategoriesQuery();
  const quizzesQuery = useQuizListQuery(filters);
  const categories = categoriesQuery.data ?? [];
  const page = quizzesQuery.data;

  const updateFilters = (patch: Partial<QuizFilters>): void => {
    setFilters((current) => ({ ...current, ...patch, page: 0 }));
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
        mb={1}
      >
        <Box>
          <Typography variant="h3" fontWeight={800}>
            Explore quizzes
          </Typography>
          <Typography color="text.secondary">
            {page?.total_elements ?? 0} published {page?.total_elements === 1 ? 'quiz' : 'quizzes'}
          </Typography>
        </Box>
        <Button component={RouterLink} to="/quizzes/create" variant="contained">
          Create quiz
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Search quizzes…"
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: { md: 180 }, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.categoryId}
            label="Category"
            onChange={(event) => updateFilters({ categoryId: String(event.target.value) })}
          >
            <MenuItem value="all">All categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: { md: 150 }, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={filters.difficulty}
            label="Difficulty"
            onChange={(event) => updateFilters({ difficulty: event.target.value as Difficulty | 'all' })}
          >
            <MenuItem value="all">All levels</MenuItem>
            <MenuItem value="Easy">Easy</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Hard">Hard</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: { md: 150 }, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel>Sort</InputLabel>
          <Select
            value={filters.sort}
            label="Sort"
            onChange={(event) => updateFilters({ sort: event.target.value as QuizFilters['sort'] })}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="popular">Most popular</MenuItem>
            <MenuItem value="title">A–Z</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {quizzesQuery.isLoading ? (
        <Loading label="Finding great quizzes…" />
      ) : quizzesQuery.isError ? (
        <ErrorState error={quizzesQuery.error} onRetry={() => void quizzesQuery.refetch()} />
      ) : !page || page.content.length === 0 ? (
        <EmptyState
          title="No quizzes found"
          body="Try a different search or filter, or create the first one."
          action={
            <Button component={RouterLink} to="/quizzes/create" variant="contained">
              Create a quiz
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
              alignItems: 'stretch',
              gap: 2.5,
            }}
          >
            {page.content.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </Box>
          {page && page.total_pages > 1 && (
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" mt={4}>
              <Button
                disabled={filters.page === 0 || quizzesQuery.isFetching}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              >
                Previous
              </Button>
              <Pagination
                count={page.total_pages}
                page={filters.page + 1}
                onChange={(_event, value) => setFilters((current) => ({ ...current, page: value - 1 }))}
              />
              <Button
                disabled={filters.page >= page.total_pages - 1 || quizzesQuery.isFetching}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Next
              </Button>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
