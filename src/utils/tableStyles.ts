
import {
    DARK_PRIMARY,
    DARK_TEXT_ENABLED,
    DARK_PRIMARY_HOVER,
    DARK_TEXT_DISABLED,
    DARK_SECONDARY
  } from './constants';

  
  // Shared button styles
  export const createButtonStyles = (darkMode: boolean) => ({
    backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
    color: darkMode ? DARK_TEXT_ENABLED : '#000000',
    '&.Mui-disabled': {
      color: darkMode ? DARK_TEXT_DISABLED : '#aaaaaa',
    },
    '&:hover': {
      backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
    },
  });
  
  // Shared dialog styles
  export const createDialogStyles = () => ({
    PaperProps: {
      sx: {
        backgroundColor: DARK_SECONDARY,
        borderRadius: '0.5rem',
        backgroundImage: 'none',
      },
    },
  });