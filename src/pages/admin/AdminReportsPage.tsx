import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { ErrorState, Loading } from '../../components/Feedback';
import RowActionsMenu from '../../components/admin/RowActionsMenu';
import { AdminPage, AdminToolbar } from '../../components/admin/AdminPage';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAdminReportsQuery, useResolveReport, useUnpublishReportedQuiz } from '../../hooks/useReports';
import type { QuizReport, ReportReason, ReportStatus } from '../../types';

const reasonLabels: Record<ReportReason, string> = {
  INACCURATE: 'Incorrect information',
  SPAM: 'Spam or advertising',
  OFFENSIVE: 'Offensive content',
  DUPLICATE: 'Duplicate quiz',
  COPYRIGHT: 'Copyright concern',
  OTHER: 'Other',
};

const statusColors: Record<ReportStatus, 'warning' | 'success' | 'default'> = {
  OPEN: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'default',
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('OPEN');
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<QuizReport | null>(null);
  const [note, setNote] = useState('');
  const [unpublishTarget, setUnpublishTarget] = useState<QuizReport | null>(null);

  const query = useAdminReportsQuery(status, page);
  const resolve = useResolveReport();
  const unpublish = useUnpublishReportedQuiz();
  const mutationError = resolve.error ?? unpublish.error;

  const reports = query.data?.content ?? [];
  const total = query.data?.total_elements ?? 0;

  const closeDialog = (): void => {
    setActive(null);
    setNote('');
    resolve.reset();
  };

  return (
    <AdminPage
      title="Reports"
      description="Community reports on user-authored quizzes. Every report records who filed it and why."
      resultSummary={
        query.isFetching ? 'Updating…' : `${total} ${status.toLowerCase()} ${total === 1 ? 'report' : 'reports'}`
      }
    >
      <AdminToolbar>
        <TextField
          select
          size="small"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ReportStatus);
            setPage(0);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
          <MenuItem value="DISMISSED">Dismissed</MenuItem>
        </TextField>
      </AdminToolbar>

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(mutationError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not complete that action.'}
        </Alert>
      )}

      {query.isLoading ? (
        <Loading label="Loading reports…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : reports.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 1.5 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
          <Typography fontWeight={700}>Nothing to review</Typography>
          <Typography variant="body2" color="text.secondary">
            No {status.toLowerCase()} reports in the moderation queue.
          </Typography>
        </Paper>
      ) : (
        <>
          <Stack spacing={1.5}>
            {reports.map((report) => (
              <Paper key={report.id} variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                      <Chip
                        size="small"
                        color={statusColors[report.status]}
                        variant="outlined"
                        icon={<FlagOutlinedIcon fontSize="small" />}
                        label={report.status}
                      />
                      <Chip size="small" variant="outlined" label={reasonLabels[report.reason]} />
                    </Stack>
                    <Typography fontWeight={700} noWrap>
                      {report.quiz_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reported by {report.reporter_username ?? 'unknown'} ·{' '}
                      {new Date(report.created_at).toLocaleString()}
                      {report.quiz_author ? ` · quiz by ${report.quiz_author}` : ''}
                    </Typography>
                    {report.details && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.primary">
                        “{report.details}”
                      </Typography>
                    )}
                    {report.resolution_note && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {report.status}: {report.resolution_note}
                        {report.resolved_by ? ` (${report.resolved_by})` : ''}
                      </Typography>
                    )}
                  </Box>
                  <RowActionsMenu
                    label={`Actions for report on ${report.quiz_title}`}
                    actions={[
                      {
                        label: 'Review details',
                        icon: <VisibilityOutlinedIcon fontSize="small" />,
                        onSelect: () => {
                          setActive(report);
                          setNote('');
                        },
                      },
                      {
                        label: 'Open quiz',
                        icon: <VisibilityOutlinedIcon fontSize="small" />,
                        disabled: report.status !== 'OPEN',
                        onSelect: () => {
                          window.location.assign(`/quizzes/${report.quiz_id}`);
                        },
                      },
                      {
                        label: 'Unpublish quiz',
                        icon: <VisibilityOffOutlinedIcon fontSize="small" />,
                        color: 'error',
                        disabled: report.status !== 'OPEN' || unpublish.isPending,
                        onSelect: () => setUnpublishTarget(report),
                      },
                      {
                        label: 'Mark resolved',
                        icon: <CheckCircleOutlineIcon fontSize="small" />,
                        color: 'success',
                        disabled: report.status !== 'OPEN' || resolve.isPending,
                        onSelect: () =>
                          resolve.mutate({ id: report.id, next: 'RESOLVED', note: 'Reviewed by an administrator' }),
                      },
                      {
                        label: 'Dismiss report',
                        icon: <BlockOutlinedIcon fontSize="small" />,
                        disabled: report.status !== 'OPEN' || resolve.isPending,
                        onSelect: () => resolve.mutate({ id: report.id, next: 'DISMISSED', note: null }),
                      },
                    ]}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>

          {query.data && query.data.total_pages > 1 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Page {page + 1} of {query.data.total_pages}
              </Typography>
              <Pagination
                count={query.data.total_pages}
                page={page + 1}
                onChange={(_event, value) => setPage(value - 1)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      <Dialog open={Boolean(active)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Report details</DialogTitle>
        <DialogContent>
          {active && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography fontWeight={700}>{active.quiz_title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Authored by {active.quiz_author ?? 'unknown'}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 1.5, border: 1, borderColor: 'divider', display: 'grid', gap: 1 }}>
                <Row label="Reported by" value={active.reporter_username ?? active.reporter_id} />
                <Row label="Reason" value={reasonLabels[active.reason]} />
                <Row label="Filed" value={new Date(active.created_at).toLocaleString()} />
                <Row label="Status" value={active.status} />
              </Box>
              {active.details ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Reporter notes
                  </Typography>
                  <Typography variant="body2">{active.details}</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  The reporter did not add extra notes.
                </Typography>
              )}
              <TextField
                label="Resolution note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                multiline
                minRows={2}
                inputProps={{ maxLength: 500 }}
                helperText={`${note.length}/500`}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={closeDialog} disabled={resolve.isPending}>
            Close
          </Button>
          <Button component={RouterLink} to={`/quizzes/${active?.quiz_id}`} onClick={closeDialog} variant="outlined">
            Open quiz
          </Button>
          <Button
            color="inherit"
            disabled={resolve.isPending || active?.status !== 'OPEN'}
            onClick={() =>
              active &&
              resolve.mutate({ id: active.id, next: 'DISMISSED', note: note || null }, { onSettled: closeDialog })
            }
          >
            Dismiss
          </Button>
          <Button
            color="error"
            variant="outlined"
            disabled={unpublish.isPending || active?.status !== 'OPEN'}
            onClick={() => active && setUnpublishTarget(active)}
          >
            Unpublish quiz
          </Button>
          <Button
            variant="contained"
            disabled={resolve.isPending || active?.status !== 'OPEN'}
            onClick={() =>
              active &&
              resolve.mutate({ id: active.id, next: 'RESOLVED', note: note || null }, { onSettled: closeDialog })
            }
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(unpublishTarget)}
        title="Unpublish this quiz?"
        message={`“${unpublishTarget?.quiz_title ?? 'This quiz'}” will be hidden from everyone and the report will be marked resolved.`}
        confirmLabel="Unpublish quiz"
        destructive
        busy={unpublish.isPending}
        onCancel={() => setUnpublishTarget(null)}
        onConfirm={() => {
          if (!unpublishTarget) return;
          unpublish.mutate(unpublishTarget.id, {
            onSettled: () => {
              setUnpublishTarget(null);
              closeDialog();
            },
          });
        }}
      />
    </AdminPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}
