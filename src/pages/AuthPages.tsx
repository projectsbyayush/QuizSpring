import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { guestCredentials } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const passwordSchema = z.string().min(8, 'Use at least 8 characters');
const usernameSchema = z.string().trim().min(3, 'Use at least 3 characters').max(50, 'Use at most 50 characters');

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Password is required') });
const signupSchema = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema });
const forgotSchema = z.object({ email: emailSchema });
const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type ResetValues = z.infer<typeof resetSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box display="flex" justifyContent="center" py={4}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}

function FormError({ message }: { message?: string }) {
  return message ? (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  ) : null;
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [demoPending, setDemoPending] = useState(false);
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await signIn({ email: values.email.trim(), password: values.password });
    if (result.error) setError(result.error);
    else navigate(result.user?.role === 'admin' ? '/admin' : from, { replace: true });
  });

  const tryDemo = async (): Promise<void> => {
    setError(null);
    setDemoPending(true);
    try {
      const result = await signUp(guestCredentials());
      if (result.error) setError(result.error);
      else navigate('/dashboard', { replace: true });
    } finally {
      setDemoPending(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue learning.">
      <FormError message={error ?? undefined} />
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
            error={Boolean(formState.errors.email)}
            helperText={formState.errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            autoComplete="current-password"
            error={Boolean(formState.errors.password)}
            helperText={formState.errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="contained" size="large" disabled={formState.isSubmitting} fullWidth>
            {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button variant="outlined" size="large" disabled={demoPending} onClick={() => void tryDemo()} fullWidth>
            {demoPending ? 'Creating demo account…' : 'Try a demo account'}
          </Button>
          <Stack direction="row" justifyContent="space-between">
            <MuiLink component={RouterLink} to="/forgot-password" variant="body2">
              Forgot password?
            </MuiLink>
            <MuiLink component={RouterLink} to="/signup" variant="body2">
              Create account
            </MuiLink>
          </Stack>
        </Stack>
      </Box>
    </AuthShell>
  );
}

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await signUp(values);
    if (result.error) setError(result.error);
    else navigate('/dashboard', { replace: true });
  });

  return (
    <AuthShell title="Create your account" subtitle="Start building your learning streak today.">
      <FormError message={error ?? undefined} />
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Username"
            required
            fullWidth
            autoComplete="username"
            error={Boolean(formState.errors.username)}
            helperText={formState.errors.username?.message ?? '3 to 50 characters.'}
            {...register('username')}
          />
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
            error={Boolean(formState.errors.email)}
            helperText={formState.errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={Boolean(formState.errors.password)}
            helperText={formState.errors.password?.message ?? 'Use at least 8 characters.'}
            {...register('password')}
          />
          <Button type="submit" variant="contained" size="large" disabled={formState.isSubmitting} fullWidth>
            {formState.isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Already have an account?{' '}
            <MuiLink component={RouterLink} to="/login">
              Sign in
            </MuiLink>
          </Typography>
        </Stack>
      </Box>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    setResetToken(null);
    const result = await forgotPassword(values.email.trim());
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.response) {
      setMessage(result.response.message);
      setResetToken(result.response.token ?? null);
    }
  });

  return (
    <AuthShell title="Forgot password" subtitle="We will send reset instructions to your email.">
      <FormError message={error ?? undefined} />
      {message && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          action={
            resetToken ? (
              <MuiLink
                component={RouterLink}
                to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                color="inherit"
                fontWeight={700}
              >
                Continue
              </MuiLink>
            ) : undefined
          }
        >
          {message}
        </Alert>
      )}
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
            error={Boolean(formState.errors.email)}
            helperText={formState.errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" variant="contained" size="large" disabled={formState.isSubmitting} fullWidth>
            {formState.isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
          <MuiLink component={RouterLink} to="/login" variant="body2" textAlign="center">
            Back to sign in
          </MuiLink>
        </Stack>
      </Box>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await resetPassword({ token, new_password: values.password });
    if (result.error) setError(result.error);
    else window.setTimeout(() => navigate('/login', { replace: true }), 900);
  });

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      {!token && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This reset link is missing its token. Request a new link to continue.
        </Alert>
      )}
      <FormError message={error ?? undefined} />
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="New password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={Boolean(formState.errors.password)}
            helperText={formState.errors.password?.message ?? 'Use at least 8 characters.'}
            {...register('password')}
          />
          <TextField
            label="Confirm password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={Boolean(formState.errors.confirmPassword)}
            helperText={formState.errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" variant="contained" size="large" disabled={formState.isSubmitting || !token} fullWidth>
            {formState.isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  );
}

export function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await changePassword({ current_password: values.currentPassword, new_password: values.password });
    if (result.error) setError(result.error);
    else navigate('/login', { replace: true });
  });

  return (
    <Box maxWidth={560} mx="auto">
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Change password
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Updating your password signs you out of this device.
      </Typography>
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <FormError message={error ?? undefined} />
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Current password"
                type="password"
                required
                fullWidth
                autoComplete="current-password"
                error={Boolean(formState.errors.currentPassword)}
                helperText={formState.errors.currentPassword?.message}
                {...register('currentPassword')}
              />
              <TextField
                label="New password"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                error={Boolean(formState.errors.password)}
                helperText={formState.errors.password?.message ?? 'Use at least 8 characters.'}
                {...register('password')}
              />
              <TextField
                label="Confirm new password"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                error={Boolean(formState.errors.confirmPassword)}
                helperText={formState.errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" variant="contained" disabled={formState.isSubmitting} fullWidth>
                {formState.isSubmitting ? 'Updating…' : 'Update password'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export const AuthPages = {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ChangePasswordPage,
};
