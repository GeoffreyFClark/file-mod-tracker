
import {
    DARK_PRIMARY,
    DARK_TEXT_SELECTED,
    DARK_TEXT_ENABLED,
    DARK_PRIMARY_HOVER,
    DARK_TEXT_DISABLED,
    DARK_SECONDARY
  } from './constants';

// tableStyles.ts
import { MaterialReactTableProps } from 'material-react-table';

export const createTableStyles = <T extends Record<string, any>>(
  darkMode: boolean
): Partial<MaterialReactTableProps<T>> => ({
  muiTablePaperProps: {
    sx: {
      borderRadius: '.5rem',
      backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
    },
  },
  muiTableBodyRowProps: {
    sx: {
      backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      '&:hover': {
        backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
      },
    },
  },
  muiTableBodyCellProps: {
    sx: {
      color: darkMode ? DARK_TEXT_SELECTED : '#000000',
      borderBottom: `1px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
    },
  },
  muiTableHeadCellProps: {
    sx: {
      backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      color: darkMode ? DARK_TEXT_SELECTED : '#000000',
      fontWeight: 'bold',
    },
  },
  muiTopToolbarProps: {
    sx: {
      backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      color: darkMode ? DARK_TEXT_SELECTED : '#000000',
    },
  },
  muiBottomToolbarProps: {
    sx: {
      backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      color: darkMode ? DARK_TEXT_SELECTED : '#000000',
    },
  },
  muiTableContainerProps: {
    sx: {
      backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
    },
  },
});
  
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