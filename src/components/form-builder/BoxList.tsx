
import React from "react";
import FormBoxComponent from "./FormBoxComponent";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import EmptyState from "./EmptyState";

interface BoxListProps {
  boxes: any[];
  fields: any[];
  onAddField: (boxId: string) => void;
  onDeleteBox: (boxId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onEditField: (fieldId: string, newData: any) => void;
  onEditBox: (boxId: string, newData: any) => void;
  onAddBox: () => void;
  onMoveBox: (boxId: string, direction: 'up' | 'down') => void;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => void;
  onUpdateLayout: (boxId: string, layoutData: any) => void;
  onToggleLockWhenSigned?: (boxId: string, value: boolean) => void;
  isLoading: boolean;
  isLocked?: boolean;
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
  onToggleLockWhenSigned,
  isLoading,
  isLocked = false
}: BoxListProps) {
  // Ordenar boxes pela propriedade order
  const sortedBoxes = [...boxes].sort((a, b) => 
    (a.order || 0) - (b.order || 0)
  );

  if (sortedBoxes.length === 0) {
    return <EmptyState onAddBox={onAddBox} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-6">
      {sortedBoxes.map((box, index) => {
        const boxFields = fields.filter(field => field.box_id === box.id);
        
        // Ordenar campos pelo order
        const sortedBoxFields = [...boxFields].sort((a, b) => 
          (a.order || 0) - (b.order || 0)
        );

        return (
          <FormBoxComponent
            key={box.id}
            box={box}
            fields={sortedBoxFields}
            onAddField={() => onAddField(box.id)}
            onDeleteBox={() => onDeleteBox(box.id)}
            onDeleteField={onDeleteField}
            onEditField={onEditField}
            onEditBox={(newData) => onEditBox(box.id, newData)}
            onMoveUp={index > 0 ? () => onMoveBox(box.id, 'up') : undefined}
            onMoveDown={index < sortedBoxes.length - 1 ? () => onMoveBox(box.id, 'down') : undefined}
            onMoveField={onMoveField}
            onUpdateLayout={(layoutData) => onUpdateLayout(box.id, layoutData)}
            onToggleLockWhenSigned={onToggleLockWhenSigned ? 
              (value: boolean) => onToggleLockWhenSigned(box.id, value) : undefined}
            isLoading={isLoading}
            isLocked={isLocked}
          />
        );
      })}
      
      {!isLocked && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={onAddBox}
            className="w-full md:w-auto"
            disabled={isLoading}
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Adicionar Nova Seção
          </Button>
        </div>
      )}
    </div>
  );
}
