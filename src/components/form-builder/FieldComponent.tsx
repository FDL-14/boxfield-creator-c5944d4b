
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Save, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const fieldTypeLabels = {
  short_text: "Texto Curto",
  long_text: "Texto Longo",
  checkbox: "Caixa de Seleção",
  checkbox_with_text: "Caixa de Seleção com Texto",
  date: "Data",
  time: "Hora",
  signature: "Assinatura"
};

export default function FieldComponent({ field, onDelete, onEdit, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedField, setEditedField] = useState(field);

  const handleSave = () => {
    onEdit(editedField);
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
      case "checkbox_with_text":
        return (
          <div className="flex items-center gap-2">
            <Checkbox disabled className="transition-all duration-300" />
            <Input disabled className="w-48 transition-all duration-300" placeholder="Texto adicional" />
          </div>
        );
      case "date":
        return <Input type="date" disabled className="transition-all duration-300" />;
      case "time":
        return <Input type="time" disabled className="transition-all duration-300" />;
      case "signature":
        return (
          <div className="border-2 border-dashed rounded p-4 text-center text-gray-500 transition-all duration-300">
            Área para Assinatura
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
          {field.type === "checkbox_with_text" && (
            <Input
              value={editedField.extra_text || ""}
              onChange={(e) => setEditedField({ ...editedField, extra_text: e.target.value })}
              placeholder="Texto adicional"
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
              disabled={isLoading}
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
            onClick={onDelete}
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
