import { useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Container, Divider, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { guestCredentials } from '../api/auth';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const highlights = [
  {
    image: '/photo-library.jpg',
    alt: 'Students studying among bookshelves in a library',
    accent: 'primary.main',
    title: 'Quizzes with a clear structure',
    text: 'Questions, answers, explanations, and timing stay together in one readable place.',
  },
  {
    image: '/photo-group.jpg',
    alt: 'Students collaborating over books and a laptop',
    accent: 'secondary.main',
    title: 'Feedback that teaches',
    text: 'Review performance, accuracy, and XP without hunting through disconnected pages.',
  },
  {
    image: '/photo-writing.jpg',
    alt: 'A person writing notes in a notebook at a desk',
    accent: 'success.main',
    title: 'Made for creators too',
    text: 'Write questions once, publish deliberately, and keep drafts separate from live quizzes.',
  },
];

const steps = [
  {
    icon: <MenuBookOutlinedIcon />,
    title: 'Choose a topic',
    text: 'Start with a subject that fits your next session.',
  },
  {
    icon: <TimerOutlinedIcon />,
    title: 'Focus on one attempt',
    text: 'Move through questions without unnecessary noise.',
  },
  {
    icon: <CheckCircleOutlineIcon />,
    title: 'Learn from the result',
    text: 'Review the reasoning, not just the score.',
  },
];

const assurances = ['Timed attempts', 'Answer explanations', 'Progress tracking', 'Creator tools'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [demoPending, setDemoPending] = useState(false);

  const tryDemo = async (): Promise<void> => {
    setDemoPending(true);
    try {
      const result = await signUp(guestCredentials());
      if (result.error) showToast(result.error, 'error');
      else navigate('/dashboard', { replace: true });
    } finally {
      setDemoPending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          backgroundColor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            py: { xs: 10, md: 14 },
            backgroundImage: (theme) =>
              theme.palette.mode === 'light'
                ? 'radial-gradient(circle, #d3d7de 1.2px, transparent 1.3px)'
                : 'radial-gradient(circle, rgba(148,163,184,0.28) 1.2px, transparent 1.3px)',
            backgroundSize: '22px 22px',
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(380px, 0.9fr)' },
                gap: { xs: 6, md: 10 },
                alignItems: 'center',
                minHeight: { md: 640 },
              }}
            >
              <Box>
                <Chip
                  icon={<Box component="img" src="/quizspring-logo.svg" alt="" sx={{ width: 18, height: 18 }} />}
                  label="A focused space for better learning"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', sm: '4.2rem', md: '5.2rem' }, maxWidth: 740 }}>
                  Turn practice into progress you can see.
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  fontWeight={400}
                  sx={{ mt: 3, maxWidth: 640, lineHeight: 1.7 }}
                >
                  QuizSpring gives your questions a clear place to land. Take a focused quiz, understand every answer,
                  and return whenever you are ready to improve.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                  <Button component={RouterLink} to="/signup" variant="contained" size="large">
                    Get Started
                  </Button>
                  <Button component={RouterLink} to="/login" variant="outlined" size="large">
                    Sign In
                  </Button>
                </Stack>
                <Button
                  variant="text"
                  size="large"
                  disabled={demoPending}
                  onClick={() => void tryDemo()}
                  sx={{
                    mt: 1,
                    ml: { xs: 0, sm: -1 },
                    color: 'primary.main',
                    fontWeight: 700,
                    textDecoration: 'none',
                    '&:hover': { backgroundColor: 'rgba(0,113,227,0.06)' },
                  }}
                >
                  {demoPending ? 'Creating your demo…' : 'Just looking? Try a demo account →'}
                </Button>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
                  {assurances.map((assurance) => (
                    <Chip
                      key={assurance}
                      size="small"
                      variant="outlined"
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                      label={assurance}
                    />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Free to start. No credit card required.
                </Typography>
              </Box>

              <Card sx={{ width: '100%', maxWidth: 560, justifySelf: { md: 'end' } }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box
                    component="img"
                    src="/photo-hero.jpg"
                    alt="Students studying together in a bright library"
                    sx={{
                      display: 'block',
                      width: '100%',
                      height: { xs: 220, md: 280 },
                      objectFit: 'cover',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  />
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box component="img" src="/quizspring-logo.svg" alt="" sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography fontWeight={800}>A calmer learning rhythm</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Built around attention, not pressure.
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack spacing={2.5} sx={{ mt: 3 }}>
                    {steps.map((item) => (
                      <Stack key={item.title} direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{ color: 'primary.main', mt: 0.25 }}>{item.icon}</Box>
                        <Box>
                          <Typography fontWeight={700}>{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {item.text}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Container>
        </Box>

        <Box
          id="features"
          sx={{
            scrollMarginTop: 96,
            backgroundColor: 'background.paper',
            borderY: 1,
            borderColor: 'divider',
            py: { xs: 8, md: 12 },
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="overline" color="primary" fontWeight={800}>
              Why QuizSpring
            </Typography>
            <Typography variant="h2" sx={{ mt: 1, maxWidth: 720 }}>
              Everything around the question stays simple.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 680, lineHeight: 1.7 }}>
              No cluttered dashboard or scattered tools. QuizSpring keeps learning, reviewing, and creating in one
              consistent workflow.
            </Typography>
            <Box
              sx={{
                mt: 5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gridAutoRows: '1fr',
                alignItems: 'stretch',
                gap: 3,
              }}
            >
              {highlights.map((highlight) => (
                <Card
                  key={highlight.title}
                  sx={{ height: '100%', display: 'flex', borderTop: '4px solid', borderTopColor: highlight.accent }}
                >
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box
                      component="img"
                      src={highlight.image}
                      alt={highlight.alt}
                      sx={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 2 }}
                    />
                    <Typography variant="h5">{highlight.title}</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {highlight.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Container>
        </Box>

        <Box id="how-it-works" sx={{ scrollMarginTop: 96, py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Typography variant="overline" color="primary" fontWeight={800}>
              How it works
            </Typography>
            <Typography variant="h2" sx={{ mt: 1, maxWidth: 720 }}>
              A short rhythm you can repeat every day.
            </Typography>
            <Box
              sx={{
                mt: 5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gridAutoRows: '1fr',
                alignItems: 'stretch',
                gap: 3,
              }}
            >
              {steps.map((step, index) => {
                const accent = index === 1 ? 'secondary.main' : index === 2 ? 'success.main' : 'primary.main';
                return (
                  <Card key={step.title} sx={{ height: '100%', display: 'flex' }}>
                    <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: accent }}>
                        {String(index + 1).padStart(2, '0')}
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ color: accent }}>{step.icon}</Box>
                        <Typography variant="h5">{step.title}</Typography>
                      </Stack>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {step.text}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            <Card sx={{ mt: 6, border: 'none', backgroundColor: 'primary.main', color: '#fff' }}>
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.2fr) minmax(240px, 0.8fr)' },
                    gap: { xs: 4, md: 6 },
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="h3">Start your first focused session today.</Typography>
                    <Typography sx={{ mt: 2, maxWidth: 560, opacity: 0.88, lineHeight: 1.7 }}>
                      Create an account, explore quizzes, or publish your own. Your progress, explanations, and history
                      will be waiting when you come back.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                      <Button
                        component={RouterLink}
                        to="/signup"
                        variant="contained"
                        size="large"
                        sx={{ bgcolor: '#fff', color: '#0071e3', '&:hover': { bgcolor: '#f0f0f0' } }}
                      >
                        Create free account
                      </Button>
                      <Button
                        component={RouterLink}
                        to="/login"
                        variant="outlined"
                        size="large"
                        sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.65)' }}
                      >
                        Sign in
                      </Button>
                    </Stack>
                  </Box>
                  <Box
                    component="img"
                    src="/photo-trophies.jpg"
                    alt="Golden trophies lined up for an award ceremony"
                    sx={{
                      width: '100%',
                      maxWidth: 340,
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 2,
                      justifySelf: { xs: 'start', md: 'end' },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
