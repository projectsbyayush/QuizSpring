import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, IconButton, MenuItem, Paper } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

export interface RowAction {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  color?: 'default' | 'error' | 'success';
  disabled?: boolean;
  hidden?: boolean;
}

export default function RowActionsMenu({ actions, label = 'Row actions' }: { actions: RowAction[]; label?: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setAnchor(null);
    };
    const onClick = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setAnchor(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [anchor]);

  const visible = actions.filter((action) => !action.hidden);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', display: 'inline-flex' }}>
      <IconButton
        size="small"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      {anchor && (
        <Paper
          elevation={6}
          role="menu"
          sx={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 1300,
            minWidth: 180,
            borderRadius: 1.5,
            overflow: 'hidden',
            py: 0.5,
          }}
        >
          {visible.map((action) => (
            <MenuItem
              key={action.label}
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                setAnchor(null);
                action.onSelect();
              }}
              sx={{ gap: 1.5, fontSize: 14, color: action.color === 'error' ? 'error.main' : 'text.primary' }}
            >
              {action.icon}
              {action.label}
            </MenuItem>
          ))}
        </Paper>
      )}
    </Box>
  );
}
