
import React from "react";
import FormBoxComponent from "./FormBoxComponent";
import EmptyState from "./EmptyState";

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
  isLoading: boolean;
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
  isLoading
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
          onEditBox={onEditBox}
          onMoveUp={index > 0 && onMoveBox ? () => onMoveBox(box.id, 'up') : undefined}
          onMoveDown={index < boxes.length - 1 && onMoveBox ? () => onMoveBox(box.id, 'down') : undefined}
          onMoveField={onMoveField}
          isLoading={isLoading}
        />
      ))}

      {boxes.length === 0 && (
        <EmptyState onAddBox={onAddBox} isLoading={isLoading} />
      )}
    </div>
  );
}
