
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SignatureFieldProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

const SignatureField: React.FC<SignatureFieldProps> = ({
  value = '',
  onChange,
  disabled = false,
  label
}) => {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[120px] bg-gray-50">
        <div className="text-center text-gray-500 text-sm">
          Campo de Assinatura
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua assinatura ou nome"
          disabled={disabled}
          className="mt-2"
        />
        <div className="text-xs text-gray-400 mt-2 text-center">
          Funcionalidade de assinatura digital será implementada
        </div>
      </div>
    </div>
  );
};

export default SignatureField;
