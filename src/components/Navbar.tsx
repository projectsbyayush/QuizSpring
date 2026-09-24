import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { useAuth } from '../contexts/AuthContext';
import { useColorMode } from '../contexts/ColorModeContext';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [mobileAnchor, setMobileAnchor] = useState<HTMLElement | null>(null);

  const displayName = user?.username || user?.email.split('@')[0] || 'Account';
  const authenticatedLinks = [
    { label: 'Home', to: '/dashboard' },
    { label: 'Explore', to: '/quizzes' },
    { label: 'My quizzes', to: '/quizzes/mine' },
    { label: 'Create', to: '/quizzes/create' },
  ];
  const guestLinks = [
    { label: 'Home', to: '/' },
    { label: 'Features', to: '/#features' },
    { label: 'How it works', to: '/#how-it-works' },
  ];

  const isActive = (to: string): boolean => {
    if (to.startsWith('/#')) return location.hash === to.slice(1);
    if (to === '/') return location.pathname === '/';
    if (to === '/quizzes') {
      if (location.pathname === '/quizzes') return true;
      const section = location.pathname.split('/')[2];
      return Boolean(section) && section !== 'mine' && section !== 'create';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const linkStyle = (to: string) => ({
    fontWeight: isActive(to) ? 800 : 650,
    color: isActive(to) ? 'primary.main' : 'text.secondary',
    borderRadius: 2,
    paddingLeft: 1.5,
    paddingRight: 1.5,
    position: 'relative',
    '&:hover': { color: 'text.primary', backgroundColor: 'transparent' },
    '&::after': isActive(to)
      ? {
          content: '""',
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 6,
          height: 3,
          borderRadius: 99,
          backgroundColor: 'primary.main',
        }
      : {},
  });

  const closeMobileMenu = (): void => setMobileAnchor(null);

  const handleSignOut = async (): Promise<void> => {
    setAccountAnchor(null);
    await signOut();
    navigate('/');
  };

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 64, md: 76 } }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              mr: { xs: 0, md: 2 },
              '&:hover .quizspring-logo': { transform: 'rotate(-6deg) scale(1.05)' },
            }}
          >
            <Box
              component="img"
              className="quizspring-logo"
              src="/quizspring-logo.svg"
              alt="QuizSpring logo"
              sx={{ width: 40, height: 40, transition: 'transform 0.18s ease' }}
            />
            <Box sx={{ lineHeight: 1 }}>
              <Typography variant="h6" fontWeight={800} letterSpacing="-0.03em">
                QuizSpring
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: 'none', lg: 'block' }, fontWeight: 600 }}
              >
                Learn. Play. Master.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.25 }}>
            {(user ? authenticatedLinks : guestLinks).map((link) => (
              <Button key={link.label} component={RouterLink} to={link.to} color="inherit" sx={linkStyle(link.to)}>
                {link.label}
              </Button>
            ))}
            {user && isAdmin && (
              <Button component={RouterLink} to="/admin" color="inherit" sx={linkStyle('/admin')}>
                Admin
              </Button>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={toggle} aria-label="Toggle color mode" sx={{ mr: 0.5 }}>
            {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>

          {user ? (
            <>
              <IconButton
                onClick={(event) => setMobileAnchor(event.currentTarget)}
                aria-label="Open navigation menu"
                sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              >
                <MenuOutlinedIcon />
              </IconButton>
              <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={closeMobileMenu}>
                {authenticatedLinks.map((link) => (
                  <MenuItem
                    key={link.label}
                    component={RouterLink}
                    to={link.to}
                    selected={isActive(link.to)}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </MenuItem>
                ))}
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/admin" selected={isActive('/admin')} onClick={closeMobileMenu}>
                    Admin
                  </MenuItem>
                )}
              </Menu>
              <IconButton
                onClick={(event) => setAccountAnchor(event.currentTarget)}
                size="small"
                aria-label="Open account menu"
              >
                <Avatar
                  src={user.avatar_url ?? undefined}
                  sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontWeight: 700 }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem component={RouterLink} to="/dashboard" onClick={() => setAccountAnchor(null)}>
                  Dashboard
                </MenuItem>
                <MenuItem component={RouterLink} to="/profile" onClick={() => setAccountAnchor(null)}>
                  Profile
                </MenuItem>
                <MenuItem component={RouterLink} to="/quizzes" onClick={() => setAccountAnchor(null)}>
                  Explore quizzes
                </MenuItem>
                <MenuItem component={RouterLink} to="/quizzes/mine" onClick={() => setAccountAnchor(null)}>
                  My quizzes
                </MenuItem>
                <MenuItem component={RouterLink} to="/quizzes/create" onClick={() => setAccountAnchor(null)}>
                  Create quiz
                </MenuItem>
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/admin" onClick={() => setAccountAnchor(null)}>
                    Admin panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => void handleSignOut()}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                <Button component={RouterLink} to="/login" color="inherit">
                  Sign in
                </Button>
                <Button component={RouterLink} to="/signup" variant="contained">
                  Get started
                </Button>
              </Box>
              <IconButton
                onClick={(event) => setMobileAnchor(event.currentTarget)}
                aria-label="Open navigation menu"
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                <MenuOutlinedIcon />
              </IconButton>
              <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={closeMobileMenu}>
                {guestLinks.map((link) => (
                  <MenuItem
                    key={link.label}
                    component={RouterLink}
                    to={link.to}
                    selected={isActive(link.to)}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </MenuItem>
                ))}
                <MenuItem component={RouterLink} to="/login" onClick={closeMobileMenu}>
                  Sign in
                </MenuItem>
                <MenuItem component={RouterLink} to="/signup" onClick={closeMobileMenu}>
                  Get started
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
