import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { createQuiz, updateQuiz } from '../api/quizzes';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ErrorState, Loading } from '../components/Feedback';
import { useCategoriesQuery, useQuizForEditQuery } from '../hooks/useQuizzes';
import type { Difficulty, ManagedQuizDetail, Question, QuestionInput, QuizCreateInput } from '../types';

interface DraftQuestion {
  question_text: string;
  options: [string, string, string, string];
  correct_answer: number;
  explanation: string;
}

function emptyQuestion(): DraftQuestion {
  return { question_text: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' };
}

function toDraft(question: Question): DraftQuestion {
  return {
    question_text: question.question_text,
    options: [
      question.options[0] ?? '',
      question.options[1] ?? '',
      question.options[2] ?? '',
      question.options[3] ?? '',
    ],
    correct_answer: question.correct_answer ?? 0,
    explanation: question.explanation ?? '',
  };
}

function toInput(question: DraftQuestion): QuestionInput {
  return {
    question_text: question.question_text.trim(),
    options: question.options.map((option) => option.trim()) as [string, string, string, string],
    correct_answer: question.correct_answer,
    explanation: question.explanation.trim() || null,
  };
}

export default function QuizEditorPage({ quizId }: { quizId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const categoriesQuery = useCategoriesQuery();
  const editQuery = useQuizForEditQuery(quizId);
  const initializedId = useRef<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [minutes, setMinutes] = useState('10');
  const [noLimit, setNoLimit] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion(), emptyQuestion(), emptyQuestion()]);

  useEffect(() => {
    const firstCategory = categoriesQuery.data?.[0];
    if (!categoryId && firstCategory) setCategoryId(firstCategory.id);
  }, [categoryId, categoriesQuery.data]);

  useEffect(() => {
    const quiz = editQuery.data;
    if (!quiz || initializedId.current === quiz.id) return;
    initializedId.current = quiz.id;
    setTitle(quiz.title);
    setDescription(quiz.description ?? '');
    setCategoryId(quiz.category_id ?? '');
    setDifficulty(quiz.difficulty);
    setNoLimit(quiz.time_limit === null);
    setMinutes(quiz.time_limit === null ? '10' : String(Math.max(1, Math.round(quiz.time_limit / 60))));
    setQuestions(quiz.questions.map(toDraft));
  }, [editQuery.data]);

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>): void => {
    setQuestions((current) =>
      current.map((question, questionIndex) => (questionIndex === index ? { ...question, ...patch } : question)),
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string): void => {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;
        const options = question.options.map((option, currentIndex) =>
          currentIndex === optionIndex ? value : option,
        ) as [string, string, string, string];
        return { ...question, options };
      }),
    );
  };

  const moveQuestion = (index: number, direction: -1 | 1): void => {
    setQuestions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const valid =
    title.trim().length >= 4 &&
    Boolean(categoryId) &&
    questions.length > 0 &&
    questions.every(
      (question) =>
        question.question_text.trim().length > 0 &&
        question.options.every((option) => option.trim().length > 0) &&
        question.correct_answer >= 0 &&
        question.correct_answer <= 3,
    );

  const saveMutation = useMutation({
    mutationFn: (published: boolean): Promise<ManagedQuizDetail> => {
      const input: QuizCreateInput = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        difficulty,
        time_limit: noLimit ? null : Math.max(1, Number(minutes) || 10) * 60,
        is_published: published,
        questions: questions.map(toInput),
      };
      return quizId ? updateQuiz(quizId, input) : createQuiz(input);
    },
    onSuccess: async (quiz) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
      ]);
      showToast('Quiz saved successfully.', 'success');
      navigate(`/quizzes/${quiz.id}`, { replace: true });
    },
  });

  if (quizId && editQuery.isLoading) return <Loading label="Loading your quiz…" />;
  if (quizId && editQuery.isError)
    return <ErrorState error={editQuery.error} onRetry={() => void editQuery.refetch()} />;
  if (quizId && editQuery.data && !editQuery.data.can_edit)
    return <ErrorState error={new Error('You do not have permission to edit this quiz.')} />;
  if (categoriesQuery.isError)
    return <ErrorState error={categoriesQuery.error} onRetry={() => void categoriesQuery.refetch()} />;

  const save = (published: boolean): void => {
    if (valid && !saveMutation.isPending) saveMutation.mutate(published);
  };

  return (
    <Box maxWidth={920} mx="auto">
      <Typography variant="h3" fontWeight={800}>
        {quizId ? 'Edit quiz' : 'Create a quiz'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Craft clear questions, choose the correct option, and publish when ready.
      </Typography>
      {saveMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(saveMutation.error)}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <TextField
              label="Quiz title"
              fullWidth
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. JavaScript Fundamentals"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What will players learn?"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="Category"
                fullWidth
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {(categoriesQuery.data ?? []).map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Difficulty"
                fullWidth
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              >
                <MenuItem value="Easy">Easy · 10 XP</MenuItem>
                <MenuItem value="Medium">Medium · 20 XP</MenuItem>
                <MenuItem value="Hard">Hard · 30 XP</MenuItem>
              </TextField>
              <TextField
                label="Minutes"
                type="number"
                fullWidth
                value={minutes}
                disabled={noLimit}
                onChange={(event) => setMinutes(event.target.value)}
                inputProps={{ min: 1, max: 1440 }}
              />
            </Box>
            <FormControlLabel
              control={<Switch checked={noLimit} onChange={(event) => setNoLimit(event.target.checked)} />}
              label="No time limit"
            />
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {questions.map((question, questionIndex) => (
          <Card key={`question-${questionIndex}`}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography fontWeight={800}>Question {questionIndex + 1}</Typography>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    disabled={questionIndex === 0}
                    onClick={() => moveQuestion(questionIndex, -1)}
                    aria-label="Move question up"
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton
                    disabled={questionIndex === questions.length - 1}
                    onClick={() => moveQuestion(questionIndex, 1)}
                    aria-label="Move question down"
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                  <IconButton
                    disabled={questions.length <= 1}
                    onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}
                    aria-label="Remove question"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Stack>
              <TextField
                label="Question text"
                fullWidth
                value={question.question_text}
                onChange={(event) => updateQuestion(questionIndex, { question_text: event.target.value })}
                sx={{ mb: 2 }}
              />
              <RadioGroup
                value={String(question.correct_answer)}
                onChange={(event) => updateQuestion(questionIndex, { correct_answer: Number(event.target.value) })}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  {question.options.map((_, optionIndex) => (
                    <FormControlLabel
                      key={`${questionIndex}-${optionIndex}`}
                      value={String(optionIndex)}
                      control={<Radio checked={question.correct_answer === optionIndex} />}
                      label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      sx={{
                        m: 0,
                        alignItems: 'flex-start',
                        border: 1,
                        borderColor: question.correct_answer === optionIndex ? 'success.main' : 'divider',
                        borderRadius: 2,
                        p: 1,
                        pl: 0.5,
                      }}
                    />
                  ))}
                </Box>
              </RadioGroup>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1.5 }}>
                {question.options.map((option, optionIndex) => (
                  <TextField
                    key={`${questionIndex}-option-${optionIndex}`}
                    label={`Option ${String.fromCharCode(65 + optionIndex)} text`}
                    fullWidth
                    value={option}
                    onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                  />
                ))}
              </Box>
              <TextField
                label="Explanation (optional)"
                fullWidth
                value={question.explanation}
                onChange={(event) => updateQuestion(questionIndex, { explanation: event.target.value })}
                placeholder="Why is this the correct answer?"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() => setQuestions((current) => [...current, emptyQuestion()])}
      >
        Add question
      </Button>

      <Divider sx={{ my: 3 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Button variant="outlined" size="large" disabled={!valid || saveMutation.isPending} onClick={() => save(false)}>
          Save as draft
        </Button>
        <Button variant="contained" size="large" disabled={!valid || saveMutation.isPending} onClick={() => save(true)}>
          {saveMutation.isPending ? 'Saving…' : quizId ? 'Save quiz' : 'Publish quiz'}
        </Button>
        {!valid && (
          <Typography variant="caption" color="text.secondary">
            Complete the title, category, questions, and all answer options.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
