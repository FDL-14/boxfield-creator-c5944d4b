
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, Edit } from "lucide-react";

interface FieldListProps {
  fields: any[];
  onEditField: (id: string, data: any) => void;
  onDeleteField: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

const FieldList: React.FC<FieldListProps> = ({
  fields,
  onEditField,
  onDeleteField,
  onMoveUp,
  onMoveDown
}) => {
  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (sortedFields.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
      </div>
    );
  }

  const getFieldTypeLabel = (type: string) => {
    const fieldTypes: Record<string, string> = {
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
    return fieldTypes[type] || type;
  };

  return (
    <div className="space-y-2">
      {sortedFields.map((field, index) => (
        <div 
          key={field.id} 
          className="flex items-center justify-between p-2 border rounded hover:bg-slate-50"
        >
          <div className="flex-grow">
            <div className="font-medium">{field.label}</div>
            <div className="text-sm text-muted-foreground">{getFieldTypeLabel(field.type)}</div>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveUp(field.id)}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveDown(field.id)}
              disabled={index === sortedFields.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditField(field.id, { })}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteField(field.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FieldList;
