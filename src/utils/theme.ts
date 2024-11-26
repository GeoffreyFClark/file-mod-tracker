import { createTheme, Theme } from '@mui/material';
import {
  DARK_PRIMARY,
  DARK_TEXT_SELECTED,
  DARK_TEXT_ENABLED,
} from './constants';

interface CreateAppThemeOptions {
  darkMode?: boolean;
}

export const createAppTheme = ({ darkMode = true }: CreateAppThemeOptions): Theme => {
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#f48fb1',
      },
      background: {
        default: darkMode ? DARK_PRIMARY : '#ffffff',
        paper: darkMode ? DARK_PRIMARY : '#ffffff',
      },
      text: {
        primary: darkMode ? DARK_TEXT_SELECTED : '#000000',
        secondary: darkMode ? '#b3b3b3' : '#666666',
      },
      info: {
        main: darkMode ? '#90caf9' : '#0288d1',
      },
    },
    components: {
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: darkMode ? DARK_TEXT_SELECTED : '#000000',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            color: darkMode ? DARK_TEXT_ENABLED : '#000000',
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            '&.Mui-checked': {
              color: DARK_TEXT_ENABLED,
            },
            '&.MuiCheckbox-indeterminate': {
              color: DARK_TEXT_ENABLED,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            '&.Mui-focused': {
              color: DARK_TEXT_ENABLED,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-focused': {
              boxShadow: 'none',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: DARK_TEXT_ENABLED,
              },
            },
          },
        },
      },
    },
  });
};