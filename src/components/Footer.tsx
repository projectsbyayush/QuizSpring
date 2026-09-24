import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Explore',
    links: [
      { label: 'Browse quizzes', to: '/quizzes' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/signup' },
      { label: 'Your profile', to: '/profile' },
    ],
  },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 8, borderTop: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: { xs: 4, md: 8 },
          }}
        >
          <Box>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box component="img" src="/quizspring-logo.svg" alt="QuizSpring logo" sx={{ width: 34, height: 34 }} />
              <Typography variant="h6" fontWeight={800}>
                QuizSpring
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 260, lineHeight: 1.6 }}>
              A focused place to practice, review, and make progress one question at a time.
            </Typography>
          </Box>
          {footerLinks.map((group) => (
            <Box key={group.title}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                {group.title}
              </Typography>
              <Stack spacing={1.25} alignItems="flex-start">
                {group.links.map((link) => (
                  <MuiLink key={link.to} component={RouterLink} to={link.to} color="text.secondary" variant="body2">
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: { xs: 4, md: 5 } }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} QuizSpring
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Built for deliberate practice.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
