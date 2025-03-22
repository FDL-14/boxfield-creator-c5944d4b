
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
  onAddBox: () => void;
  isLoading: boolean;
}

export default function BoxList({
  boxes,
  fields,
  onAddField,
  onDeleteBox,
  onDeleteField,
  onEditField,
  onAddBox,
  isLoading
}: BoxListProps) {
  return (
    <div className="space-y-6">
      {boxes.map(box => (
        <FormBoxComponent
          key={box.id}
          box={box}
          fields={fields.filter(f => f.box_id === box.id)}
          onAddField={() => onAddField(box.id)}
          onDeleteBox={() => onDeleteBox(box.id)}
          onDeleteField={onDeleteField}
          onEditField={onEditField}
          isLoading={isLoading}
        />
      ))}

      {boxes.length === 0 && (
        <EmptyState onAddBox={onAddBox} isLoading={isLoading} />
      )}
    </div>
  );
}
