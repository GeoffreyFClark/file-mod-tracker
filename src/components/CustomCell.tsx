import { useState, useRef } from 'react';
import {
  Popover,
  IconButton,
} from '@mui/material';
import {
    DARK_PRIMARY,
    DARK_TEXT_SELECTED,
    DARK_TEXT_ENABLED,
} from '../utils/constants';
import { ActionItem, CustomCellProps } from '../utils/types';


const CustomCell = ({ value, actions, actionValue }: CustomCellProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const [tooltipAnchorEl, setTooltipAnchorEl] = useState<HTMLDivElement | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string>('');
    const ref = useRef<HTMLDivElement>(null);
  
    const handleAction = async (action: ActionItem) => {
      try {
        const result: string | void = await action.onClick(actionValue ?? value);
        if (action.message) {
          setActiveTooltip(action.message);
          setTooltipAnchorEl(anchorEl);
          setAnchorEl(null);
        } else if (typeof result === 'string') {
          setActiveTooltip(`${result}`);
          setTooltipAnchorEl(anchorEl);
          setAnchorEl(null);
        }
        setTimeout(() => {
          setTooltipAnchorEl(null);
        }, 2000);
      } catch (e) {
        console.error('Error executing action:', e);
      }
    };
  
    return (
      <div
        ref={ref}
        onMouseEnter={() => setAnchorEl(ref.current)}
        onMouseLeave={() => setAnchorEl(null)}
        style={{ cursor: 'pointer' }}
      >
        {value}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          disableRestoreFocus
          sx={{
            pointerEvents: 'none',
            '& .MuiPopover-paper': {
              pointerEvents: 'auto',
              backgroundColor: DARK_PRIMARY,
              display: 'flex',
              gap: '4px',
              padding: '6px',
            },
          }}
        >
          {actions.map((action, index) => (
            <IconButton
              key={index}
              onClick={() => handleAction(action)}
              size="small"
              sx={{
                color: DARK_TEXT_SELECTED,
                transition: 'color 200ms ease-in-out',
                '&:hover': {
                  color: DARK_TEXT_ENABLED,
                }
              }}
            >
              <action.icon fontSize="small" />
            </IconButton>
          ))}
        </Popover>
        <Popover
          open={Boolean(tooltipAnchorEl)}
          anchorEl={tooltipAnchorEl}
          onClose={() => setTooltipAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{
            pointerEvents: 'none',
            '& .MuiPopover-paper': {
              backgroundColor: DARK_PRIMARY,
              padding: '6px 12px',
              fontSize: '14px',
              color: DARK_TEXT_SELECTED,
            },
          }}
        >
          {activeTooltip}
        </Popover>
      </div>
    );
};

export default CustomCell