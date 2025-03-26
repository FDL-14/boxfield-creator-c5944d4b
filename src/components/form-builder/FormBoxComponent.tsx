
import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import FieldComponent from "./FieldComponent";
import EditSectionDialog from "./EditSectionDialog";

export default function FormBoxComponent({
  box,
  fields,
  onAddField,
  onDeleteBox,
  onDeleteField,
  onEditField,
  onMoveUp,
  onMoveDown,
  onMoveField,
  onEditBox,
  isLoading
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEditBox = (newData) => {
    onEditBox(box.id, newData);
    setShowEditDialog(false);
  };

  return (
    <Card className="shadow-md animate-fade-in transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{box.title || box.name}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddField}
            disabled={isLoading}
            className="transition-all duration-300"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Adicionar Campo
          </Button>
          
          {onMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isLoading}
              className="h-9 w-9"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          
          {onMoveDown && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLoading}
              className="h-9 w-9"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditDialog(true)}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 transition-all duration-300"
            onClick={() => onDeleteBox(box.id)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
              onEdit={(fieldId, newData) => onEditField(field.id, newData)}
              onMoveUp={index > 0 && onMoveField ? () => onMoveField(field.id, 'up') : undefined}
              onMoveDown={index < fields.length - 1 && onMoveField ? () => onMoveField(field.id, 'down') : undefined}
              isLoading={isLoading}
            />
          ))}
          {fields.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Nenhum campo adicionado nesta seção
            </p>
          )}
        </div>
      </CardContent>
      
      <EditSectionDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleEditBox}
        section={box}
        isLoading={isLoading}
      />
    </Card>
  );
}
