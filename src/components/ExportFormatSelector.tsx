
import React from 'react';
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ExportFormatSelectorProps {
  value: string;
  onChange: (format: string) => void;
}

const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({ value, onChange }) => {
  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Formato de Exportação</Label>
      <RadioGroup
        value={value}
        onValueChange={handleChange}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="PDF" id="pdf" />
          <Label htmlFor="pdf">PDF</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="WORD" id="word" />
          <Label htmlFor="word">Word</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="EXCEL" id="excel" />
          <Label htmlFor="excel">Excel</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ExportFormatSelector;
