
import React from "react";
import FormBoxComponent from "./FormBoxComponent";
import EmptyState from "./EmptyState";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid } from "lucide-react";

interface BoxListProps {
  boxes: any[];
  fields: any[];
  onAddField: (boxId: string) => void;
  onDeleteBox: (boxId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onEditField: (fieldId: string, newData: any) => void;
  onEditBox?: (boxId: string, newData: any) => void;
  onAddBox: () => void;
  onMoveBox?: (boxId: string, direction: 'up' | 'down') => void;
  onMoveField?: (fieldId: string, direction: 'up' | 'down') => void;
  onUpdateLayout?: (boxId: string, layout: any) => void;
  isLoading: boolean;
  showAddButton?: boolean;
}

export default function BoxList({
  boxes,
  fields,
  onAddField,
  onDeleteBox,
  onDeleteField,
  onEditField,
  onEditBox,
  onAddBox,
  onMoveBox,
  onMoveField,
  onUpdateLayout,
  isLoading,
  showAddButton = true
}: BoxListProps) {
  return (
    <div className="space-y-6">
      {boxes.map((box, index) => (
        <FormBoxComponent
          key={box.id}
          box={box}
          fields={fields.filter(f => f.box_id === box.id)}
          onAddField={() => onAddField(box.id)}
          onDeleteBox={() => onDeleteBox(box.id)}
          onDeleteField={onDeleteField}
          onEditField={onEditField}
          onEditBox={onEditBox ? (boxId, newData) => onEditBox(boxId, newData) : undefined}
          onMoveUp={index > 0 && onMoveBox ? () => onMoveBox(box.id, 'up') : undefined}
          onMoveDown={index < boxes.length - 1 && onMoveBox ? () => onMoveBox(box.id, 'down') : undefined}
          onMoveField={onMoveField}
          onUpdateLayout={onUpdateLayout ? (layout) => onUpdateLayout(box.id, layout) : undefined}
          isLoading={isLoading}
        />
      ))}

      {boxes.length === 0 && (
        <EmptyState onAddBox={onAddBox} isLoading={isLoading} />
      )}

      {showAddButton && boxes.length > 0 && (
        <Button 
          onClick={onAddBox} 
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Nova Seção
        </Button>
      )}
    </div>
  );
}
