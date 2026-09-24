import { useState, type ReactNode } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';

interface NavigationItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navigation: NavigationItem[] = [
  { to: '/admin', label: 'Overview', icon: <DashboardOutlinedIcon /> },
  { to: '/admin/users', label: 'Users', icon: <PeopleOutlinedIcon /> },
  { to: '/admin/categories', label: 'Categories', icon: <CategoryOutlinedIcon /> },
  { to: '/admin/quizzes', label: 'Quizzes', icon: <QuizOutlinedIcon /> },
  { to: '/admin/attempts', label: 'Attempts', icon: <HistoryOutlinedIcon /> },
];

const drawerWidth = 250;

export default function AdminLayout() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const drawer = (
    <Box>
      <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Admin panel
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Manage your platform
        </Typography>
      </Toolbar>
      <List>
        {navigation.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={location.pathname === item.to}
            onClick={() => setOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton component={RouterLink} to="/dashboard" onClick={() => setOpen(false)}>
          <ListItemIcon>
            <ArrowBackIcon />
          </ListItemIcon>
          <ListItemText primary="Back to app" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box display="flex" gap={3}>
      {mobile ? (
        <>
          <IconButton onClick={() => setOpen(true)} aria-label="Open admin menu" sx={{ alignSelf: 'flex-start' }}>
            <MenuOutlinedIcon />
          </IconButton>
          <Drawer open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}>
            {drawer}
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            border: 1,
            borderColor: 'divider',
            borderRadius: 4,
            backgroundColor: 'background.paper',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 88,
            overflow: 'hidden',
          }}
        >
          {drawer}
        </Box>
      )}
      <Box flexGrow={1} minWidth={0}>
        <Outlet />
      </Box>
    </Box>
  );
}
