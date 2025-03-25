
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Save, X, Loader2, Flag, Type, Pencil, Plus, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const fieldTypeLabels = {
  short_text: "Texto Curto",
  long_text: "Texto Longo",
  checkbox: "Caixa de Seleção",
  flag: "FLAG (Seleção Múltipla)",
  flag_with_text: "FLAG + Texto",
  date: "Data",
  time: "Hora",
  signature: "Assinatura",
  image: "Foto/Imagem"
};

export default function FieldComponent({ field, onDelete, onEdit, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedField, setEditedField] = useState(field);

  const handleAddOption = () => {
    setEditedField({
      ...editedField,
      options: [...(editedField.options || []), {text: ""}]
    });
  };
  
  const handleRemoveOption = (index) => {
    const newOptions = [...(editedField.options || [])];
    newOptions.splice(index, 1);
    setEditedField({
      ...editedField,
      options: newOptions
    });
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...(editedField.options || [])];
    newOptions[index].text = value;
    setEditedField({
      ...editedField,
      options: newOptions
    });
  };

  const handleSave = () => {
    onEdit(field.id, editedField);
    setIsEditing(false);
  };

  const renderPreview = () => {
    switch (field.type) {
      case "short_text":
        return <Input disabled placeholder="Campo de texto curto" className="transition-all duration-300" />;
      case "long_text":
        return <Textarea disabled placeholder="Campo de texto longo" className="transition-all duration-300" />;
      case "checkbox":
        return <Checkbox disabled className="transition-all duration-300" />;
      case "flag":
        return (
          <div className="space-y-2 transition-all duration-300">
            <RadioGroup disabled>
              {(field.options || [{text: "Opção 1"}]).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={`option-${index}`} id={`option-${index}`} disabled />
                  <Label htmlFor={`option-${index}`} className="text-sm">{option.text}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case "flag_with_text":
        return (
          <div className="space-y-3 transition-all duration-300">
            {(field.options || [{text: "Opção 1"}]).map((option, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex items-center h-6">
                  <Checkbox disabled className="mt-1" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm mb-1 block">{option.text}</Label>
                  <Input disabled className="w-full" placeholder="Texto adicional" />
                </div>
              </div>
            ))}
          </div>
        );
      case "date":
        return <Input type="date" disabled className="transition-all duration-300" />;
      case "time":
        return <Input type="time" disabled className="transition-all duration-300" />;
      case "image":
        return (
          <div className="border-2 border-dashed rounded p-4 text-center text-gray-500 transition-all duration-300">
            <Image className="mx-auto h-6 w-6 mb-2 opacity-50" />
            <p>Campo para Upload de Imagem</p>
          </div>
        );
      case "signature":
        return (
          <div className="space-y-2 transition-all duration-300">
            <div className="border-2 border-dashed rounded p-4 text-center text-gray-500">
              <Pencil className="mx-auto h-6 w-6 mb-2 opacity-50" />
              <p>Área para Assinatura</p>
            </div>
            {field.signature_label && (
              <Input 
                value={field.signature_label} 
                disabled 
                className="text-center" 
                placeholder="Nome/Cargo" 
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (isEditing) {
    return (
      <div className="border p-4 rounded-lg bg-gray-50 animate-slide-up transition-all duration-300">
        <div className="space-y-4">
          <Input
            value={editedField.label}
            onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
            placeholder="Rótulo do campo"
            disabled={isLoading}
            className="transition-all duration-300"
          />
          
          {(editedField.type === "flag" || editedField.type === "flag_with_text") && (
            <div className="space-y-3 p-3 border rounded-lg animate-fade-in">
              <h4 className="font-medium text-sm">Opções de Seleção</h4>
              
              {(editedField.options || [{text: ""}]).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  
                  {(editedField.options || []).length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      disabled={isLoading}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={isLoading}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
          )}
          
          {editedField.type === "signature" && (
            <Input
              value={editedField.signature_label || ""}
              onChange={(e) => setEditedField({ ...editedField, signature_label: e.target.value })}
              placeholder="Nome/Cargo de quem irá assinar"
              disabled={isLoading}
              className="transition-all duration-300"
            />
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="transition-all duration-300"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 transition-all duration-300"
              disabled={isLoading || 
                ((editedField.type === "flag" || editedField.type === "flag_with_text") && 
                (editedField.options || []).some(opt => !opt.text.trim()))}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-lg hover:bg-gray-50 transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium mb-1">{field.label}</p>
          <Badge variant="secondary" className="transition-all duration-300">
            {fieldTypeLabels[field.type]}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="transition-all duration-300"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 transition-all duration-300"
            onClick={() => onDelete(field.id)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="transition-all duration-300">
        {renderPreview()}
      </div>
    </div>
  );
}
