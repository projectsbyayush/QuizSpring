import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useSubmitReport } from '../hooks/useReports';
import type { ReportReason } from '../types';

const reasons: { value: ReportReason; label: string; hint: string }[] = [
  {
    value: 'INACCURATE',
    label: 'Incorrect information',
    hint: 'A wrong answer key, bad explanation, or broken question.',
  },
  { value: 'SPAM', label: 'Spam or advertising', hint: 'Promotional content or repeated near-duplicate quizzes.' },
  { value: 'OFFENSIVE', label: 'Offensive content', hint: 'Hate speech, harassment, or inappropriate material.' },
  { value: 'DUPLICATE', label: 'Duplicate of another quiz', hint: 'The same questions already exist elsewhere.' },
  { value: 'COPYRIGHT', label: 'Copyright concern', hint: 'Uses material you do not have the right to share.' },
  { value: 'OTHER', label: 'Something else', hint: 'Tell the moderation team in your own words.' },
];

export default function ReportQuizDialog({
  open,
  quizId,
  quizTitle,
  onClose,
  onReported,
}: {
  open: boolean;
  quizId: string;
  quizTitle: string;
  onClose: () => void;
  onReported: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>('INACCURATE');
  const [details, setDetails] = useState('');
  const mutation = useSubmitReport(quizId);

  const close = (): void => {
    setReason('INACCURATE');
    setDetails('');
    mutation.reset();
    onClose();
  };

  const submit = (): void => {
    mutation.mutate(
      { reason, details },
      {
        onSuccess: () => {
          onReported();
          close();
        },
      },
    );
  };

  const selected = reasons.find((item) => item.value === reason);

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : close} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlagOutlinedIcon color="error" />
        Report this quiz
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tell us what is wrong with “{quizTitle}”. A moderator reviews every report before taking action.
        </Typography>

        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Could not submit this report.'}
          </Alert>
        )}

        <FormControl>
          <FormLabel sx={{ mb: 1, fontWeight: 700 }}>Reason</FormLabel>
          <RadioGroup value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {reasons.map((item) => (
              <FormControlLabel
                key={item.value}
                value={item.value}
                control={<Radio size="small" />}
                label={item.label}
                sx={{ alignItems: 'flex-start', mb: 0.5 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {selected && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {selected.hint}
          </Typography>
        )}

        <TextField
          label="Extra details (optional)"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          inputProps={{ maxLength: 1000 }}
          helperText={`${details.length}/1000`}
        />
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={close} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending…' : 'Submit report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
