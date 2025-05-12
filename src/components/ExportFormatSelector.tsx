
import React from 'react';
import { 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio 
} from '@mui/material';

interface ExportFormatSelectorProps {
  value: string;
  onChange: (format: string) => void;
}

const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Formato de Exportação</FormLabel>
      <RadioGroup
        row
        aria-label="formato-exportacao"
        name="formato-exportacao"
        value={value}
        onChange={handleChange}
      >
        <FormControlLabel value="PDF" control={<Radio />} label="PDF" />
        <FormControlLabel value="WORD" control={<Radio />} label="Word" />
        <FormControlLabel value="EXCEL" control={<Radio />} label="Excel" />
      </RadioGroup>
    </FormControl>
  );
};

export default ExportFormatSelector;
