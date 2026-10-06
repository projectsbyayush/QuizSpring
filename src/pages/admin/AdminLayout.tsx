import { useState } from 'react';
import { Box, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminContextSummary, AdminNavContent } from '../../components/admin/AdminNav';
import { ADMIN_TITLES } from './adminMeta';

const drawerWidth = 240;

export default function AdminLayout() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const title = ADMIN_TITLES[location.pathname] ?? 'Admin';

  return (
    <Box display="flex" gap={{ xs: 2, md: 4 }} alignItems="flex-start">
      {mobile ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
          PaperProps={{ sx: { borderRight: 1, borderColor: 'divider' } }}
        >
          <AdminNavContent onNavigate={() => setOpen(false)} />
        </Drawer>
      ) : (
        <Box
          component="nav"
          aria-label="Admin sections"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            position: 'sticky',
            top: 88,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <AdminNavContent />
          <AdminContextSummary />
        </Box>
      )}
      <Box flexGrow={1} minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          {mobile && (
            <IconButton onClick={() => setOpen(true)} aria-label="Open admin menu" sx={{ ml: -1 }}>
              <MenuOutlinedIcon />
            </IconButton>
          )}
          <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em' }}>
            {title}
          </Typography>
        </Stack>
        <Outlet />
      </Box>
    </Box>
  );
}
