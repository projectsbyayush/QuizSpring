import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
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
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));

  useEffect(() => {
    const syncHash = (): void => setHash(window.location.hash);
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const displayName = user?.username || user?.email.split('@')[0] || 'Account';
  interface NavEntry {
    label: string;
    to?: string;
    section?: string;
  }
  const authenticatedLinks: NavEntry[] = [
    { label: 'Explore', to: '/quizzes' },
    { label: 'My quizzes', to: '/quizzes/mine' },
    { label: 'Create', to: '/quizzes/create' },
  ];
  const guestLinks: NavEntry[] = [
    { label: 'Features', section: 'features' },
    { label: 'How it works', section: 'how-it-works' },
  ];

  const isActive = (link: { to?: string; section?: string }): boolean => {
    if (link.section) return location.pathname === '/' && hash === `#${link.section}`;
    const to = link.to ?? '/';
    if (to === '/') return location.pathname === '/';
    if (to === '/quizzes') {
      if (location.pathname === '/quizzes') return true;
      const section = location.pathname.split('/')[2];
      return Boolean(section) && section !== 'mine' && section !== 'create';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const linkStyle = (active: boolean) => ({
    fontWeight: active ? 800 : 650,
    color: active ? 'primary.main' : 'text.secondary',
    borderRadius: 2,
    paddingLeft: 1.5,
    paddingRight: 1.5,
    textDecoration: 'none',
    '&:hover': { color: active ? 'primary.main' : 'text.primary', backgroundColor: 'transparent' },
  });

  const closeMobileMenu = (): void => setMobileAnchor(null);

  const openAccountMenu = (event: ReactMouseEvent<HTMLElement>): void => {
    setAccountAnchor(event.currentTarget);
    const prefetch = (): void => {
      void import('../pages/ProfilePage');
      void import('../pages/ProfileEditPage');
      void import('../pages/AuthPages');
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => void;
    };
    if (idleWindow.requestIdleCallback) idleWindow.requestIdleCallback(prefetch, { timeout: 2000 });
    else window.setTimeout(prefetch, 0);
  };

  const scrollToSection = (section: string): void => {
    closeMobileMenu();
    setHash(`#${section}`);
    const scroll = (): void => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (location.pathname !== '/') {
      navigate(`/#${section}`);
      window.setTimeout(scroll, 150);
    } else {
      window.history.replaceState(null, '', `#${section}`);
      scroll();
    }
  };

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
            {(user ? authenticatedLinks : guestLinks).map((link) => {
              const active = isActive(link);
              if (link.section) {
                return (
                  <Button
                    key={link.label}
                    color="inherit"
                    onClick={() => scrollToSection(link.section as string)}
                    sx={linkStyle(active)}
                  >
                    {link.label}
                  </Button>
                );
              }
              return (
                <Button
                  key={link.label}
                  component={RouterLink}
                  to={link.to as string}
                  color="inherit"
                  sx={linkStyle(active)}
                >
                  {link.label}
                </Button>
              );
            })}
            {user && isAdmin && (
              <Button component={RouterLink} to="/admin" color="inherit" sx={linkStyle(isActive({ to: '/admin' }))}>
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
              <Menu
                anchorEl={mobileAnchor}
                open={Boolean(mobileAnchor)}
                onClose={closeMobileMenu}
                TransitionProps={{ timeout: 150 }}
              >
                {authenticatedLinks.map((link) => (
                  <MenuItem
                    key={link.label}
                    component={RouterLink}
                    to={link.to as string}
                    selected={isActive(link)}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </MenuItem>
                ))}
                {isAdmin && (
                  <MenuItem
                    component={RouterLink}
                    to="/admin"
                    selected={isActive({ to: '/admin' })}
                    onClick={closeMobileMenu}
                  >
                    Admin
                  </MenuItem>
                )}
              </Menu>
              <IconButton onClick={openAccountMenu} size="small" aria-label="Open account menu">
                <Avatar
                  src={user.avatar_url ?? undefined}
                  sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontWeight: 700 }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={accountAnchor}
                open={Boolean(accountAnchor)}
                onClose={() => setAccountAnchor(null)}
                TransitionProps={{ timeout: 150 }}
              >
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
              <Menu
                anchorEl={mobileAnchor}
                open={Boolean(mobileAnchor)}
                onClose={closeMobileMenu}
                TransitionProps={{ timeout: 150 }}
              >
                {guestLinks.map((link) => {
                  if (link.section) {
                    return (
                      <MenuItem
                        key={link.label}
                        selected={isActive(link)}
                        onClick={() => scrollToSection(link.section as string)}
                      >
                        {link.label}
                      </MenuItem>
                    );
                  }
                  return (
                    <MenuItem
                      key={link.label}
                      component={RouterLink}
                      to={link.to as string}
                      selected={isActive(link)}
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </MenuItem>
                  );
                })}
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
