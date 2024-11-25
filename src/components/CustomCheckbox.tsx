// CustomCheckbox.tsx
import { Checkbox, CheckboxProps } from '@mui/material';

export const CustomCheckbox = (props: CheckboxProps) => {
  return (
    <Checkbox
      {...props}
      sx={{
        color: 'rgb(179,179,179)',
        '&.Mui-checked': {
          color: 'rgb(182,196,255)',
        },
        ...props.sx
      }}
    />
  );
};