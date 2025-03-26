
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, PlusCircle, Trash2, Edit } from "lucide-react";
import FieldComponent from "./FieldComponent";
import EditSectionDialog from "../form-builder/EditSectionDialog";

interface FormBoxComponentProps {
  box: any;
  fields: any[];
  onAddField: () => void;
  onDeleteBox: () => void;
  onDeleteField: (fieldId: string) => void;
  onEditField: (fieldId: string, newData: any) => void;
  onEditBox?: (boxId: string, newData: any) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveField?: (fieldId: string, direction: 'up' | 'down') => void;
  isLoading: boolean;
}

export default function FormBoxComponent({
  box,
  fields,
  onAddField,
  onDeleteBox,
  onDeleteField,
  onEditField,
  onEditBox,
  onMoveUp,
  onMoveDown,
  onMoveField,
  isLoading
}: FormBoxComponentProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEditBox = (newData: any) => {
    if (onEditBox) {
      onEditBox(box.id, newData);
      setShowEditDialog(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{box.name}</CardTitle>
        <div className="flex space-x-2">
          {onMoveUp && (
            <Button
              variant="outline"
              size="icon"
              onClick={onMoveUp}
              disabled={isLoading}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              variant="outline"
              size="icon"
              onClick={onMoveDown}
              disabled={isLoading}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {onEditBox && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              disabled={isLoading}
              className="text-blue-500"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onDeleteBox}
            disabled={isLoading}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <FieldComponent
              key={field.id}
              field={field}
              onDelete={() => onDeleteField(field.id)}
              onEdit={(newData) => onEditField(field.id, newData)}
              onMoveUp={index > 0 && onMoveField ? () => onMoveField(field.id, 'up') : undefined}
              onMoveDown={index < fields.length - 1 && onMoveField ? () => onMoveField(field.id, 'down') : undefined}
              isLoading={isLoading}
            />
          ))}

          {fields.length === 0 && (
            <div className="text-center p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-gray-500">
                Nenhum campo adicionado a esta seção.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={onAddField}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>
        </div>
      </CardContent>

      {showEditDialog && (
        <EditSectionDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleEditBox}
          section={box}
          isLoading={isLoading}
        />
      )}
    </Card>
  );
}
