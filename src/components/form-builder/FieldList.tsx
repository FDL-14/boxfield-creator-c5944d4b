
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, Edit } from "lucide-react";
import FieldComponent from "./FieldComponent";

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

  return (
    <div className="space-y-4">
      {sortedFields.map((field, index) => (
        <FieldComponent 
          key={field.id}
          field={field}
          onDelete={onDeleteField}
          onEdit={onEditField}
          onMoveUp={index > 0 ? () => onMoveUp(field.id) : undefined}
          onMoveDown={index < sortedFields.length - 1 ? () => onMoveDown(field.id) : undefined}
          isLoading={false}
        />
      ))}
    </div>
  );
};

export default FieldList;
