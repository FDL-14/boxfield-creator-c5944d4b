
import React from "react";
import FormBoxComponent from "./FormBoxComponent";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import EmptyState from "./EmptyState";

interface BoxListProps {
  boxes: any[];
  fields: any[];
  onDeleteBox: (boxId: string) => void;
  onEditBox: (boxId: string, newData: any) => void;
  onAddField: (boxId: string, fieldData: any) => void;
  onEditField: (fieldId: string, newData: any) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveFieldUp: (fieldId: string) => void;
  onMoveFieldDown: (fieldId: string) => void;
  onAddBox?: () => void;
  onMoveBox?: (boxId: string, direction: 'up' | 'down') => void;
  onUpdateLayout?: (boxId: string, layoutData: any) => void;
  onToggleLockWhenSigned?: (boxId: string, value: boolean) => void;
  isLoading?: boolean;
  isLocked?: boolean;
}

export default function BoxList({
  boxes,
  fields,
  onDeleteBox,
  onEditBox,
  onAddField,
  onEditField,
  onDeleteField,
  onMoveFieldUp,
  onMoveFieldDown,
  onAddBox,
  onMoveBox,
  onUpdateLayout,
  onToggleLockWhenSigned,
  isLoading = false,
  isLocked = false
}: BoxListProps) {
  // Ordenar boxes pela propriedade order
  const sortedBoxes = [...boxes].sort((a, b) => 
    (a.order || 0) - (b.order || 0)
  );

  if (sortedBoxes.length === 0 && onAddBox) {
    return <EmptyState onAddBox={onAddBox} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-6">
      {sortedBoxes.map((box, index) => (
        <FormBoxComponent
          key={box.id}
          box={box}
          index={index}
          fields={fields.filter(field => field.box_id === box.id)}
          onDeleteBox={() => onDeleteBox(box.id)}
          onEditBox={(data) => onEditBox(box.id, data)}
          onAddField={(boxId, fieldData) => onAddField(boxId, fieldData)}
          onEditField={onEditField}
          onDeleteField={onDeleteField}
          onMoveFieldUp={onMoveFieldUp}
          onMoveFieldDown={onMoveFieldDown}
        />
      ))}
      
      {!isLocked && onAddBox && (
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
