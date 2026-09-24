import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Avatar, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/profile';
import { getErrorMessage } from '../api/client';
import { ErrorState, Loading } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileQuery } from '../hooks/useQuizzes';

const profileSchema = z.object({
  username: z.string().trim().min(3, 'Use at least 3 characters').max(50, 'Use at most 50 characters'),
  avatarUrl: z.union([z.literal(''), z.string().trim().url('Enter a valid image URL')]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const profileQuery = useProfileQuery();
  const { register, handleSubmit, reset, formState } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '', avatarUrl: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({ username: profileQuery.data.username ?? '', avatarUrl: profileQuery.data.avatar_url ?? '' });
    }
  }, [profileQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateProfile({ username: values.username.trim(), avatar_url: values.avatarUrl.trim() }),
    onSuccess: async (profile) => {
      queryClient.setQueryData(['profile'], profile);
      await refreshProfile();
      showToast('Profile updated successfully.', 'success');
      navigate('/profile', { replace: true });
    },
  });

  if (profileQuery.isLoading) return <Loading label="Loading profile settings…" />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} />;
  }

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Box maxWidth={680} mx="auto">
      <Button component={RouterLink} to="/profile" sx={{ mb: 2 }}>
        Back to profile
      </Button>
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Edit profile
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Update the details shown on your profile and quiz history.
      </Typography>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar
              src={profileQuery.data.avatar_url ?? undefined}
              sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 800 }}
            >
              {(profileQuery.data.username || profileQuery.data.email).charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{profileQuery.data.email}</Typography>
              <Typography variant="body2" color="text.secondary">
                Your email address is managed from your account settings.
              </Typography>
            </Box>
          </Stack>

          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(mutation.error)}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Username"
                fullWidth
                required
                autoComplete="username"
                error={Boolean(formState.errors.username)}
                helperText={formState.errors.username?.message ?? '3 to 50 characters.'}
                {...register('username')}
              />
              <TextField
                label="Avatar URL"
                fullWidth
                type="url"
                autoComplete="photo"
                placeholder="https://…"
                error={Boolean(formState.errors.avatarUrl)}
                helperText={formState.errors.avatarUrl?.message ?? 'Optional. Use a secure image URL.'}
                {...register('avatarUrl')}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                <Button component={RouterLink} to="/profile" variant="outlined">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
