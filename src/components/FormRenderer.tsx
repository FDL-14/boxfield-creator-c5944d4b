
import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignatureField from "@/components/form-fields/SignatureField";

interface FormRendererProps {
  boxes: any[];
  fields: any[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  readonly?: boolean;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  boxes,
  fields,
  values,
  onChange,
  readonly = false
}) => {
  const sortedBoxes = [...boxes].sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderField = (field: any) => {
    const value = values[field.id] || '';
    
    const commonProps = {
      id: field.id,
      disabled: readonly,
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            {...commonProps}
            type="text"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );

      case 'time':
        return (
          <Input
            {...commonProps}
            type="time"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => onChange(field.id, val)} disabled={readonly}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup 
            value={value} 
            onValueChange={(val) => onChange(field.id, val)}
            disabled={readonly}
          >
            {field.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string, index: number) => {
              const isChecked = Array.isArray(value) ? value.includes(option) : false;
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        onChange(field.id, [...currentValues, option]);
                      } else {
                        onChange(field.id, currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    disabled={readonly}
                  />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );

      case 'signature':
        return (
          <SignatureField
            value={value}
            onChange={(val) => onChange(field.id, val)}
            disabled={readonly}
            label={field.label}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {sortedBoxes.map((box) => {
        const boxFields = fields
          .filter(field => field.box_id === box.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
          <Card key={box.id} className="p-4">
            <h3 className="text-lg font-semibold mb-4">{box.title}</h3>
            <div className="space-y-4">
              {boxFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default FormRenderer;
