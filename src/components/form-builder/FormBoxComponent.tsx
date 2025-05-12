
import React, { useState } from "react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import FieldList from "./FieldList";
import AddFieldDialog from "./AddFieldDialog";
import { FormBox, FormField } from "@/entities/all";

interface FormBoxComponentProps {
  box: any;
  index: number;
  fields: any[];
  onDeleteBox: (id: string) => void;
  onEditBox: (id: string, data: any) => void;
  onAddField: (boxId: string, field: any) => void;
  onEditField: (id: string, data: any) => void;
  onDeleteField: (id: string) => void;
  onMoveFieldUp: (id: string) => void;
  onMoveFieldDown: (id: string) => void;
}

const FormBoxComponent: React.FC<FormBoxComponentProps> = ({
  box,
  index,
  fields,
  onDeleteBox,
  onEditBox,
  onAddField,
  onEditField,
  onDeleteField,
  onMoveFieldUp,
  onMoveFieldDown,
}) => {
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const boxFields = fields.filter((f) => f.box_id === box.id);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditBox(box.id, { title: e.target.value });
  };

  const handleLockWhenSignedChange = (checked: boolean) => {
    onEditBox(box.id, { lockWhenSigned: checked });
  };

  const openAddFieldDialog = () => {
    setIsAddFieldDialogOpen(true);
  };

  const closeAddFieldDialog = () => {
    setIsAddFieldDialogOpen(false);
  };

  const handleAddField = (fieldData: any) => {
    onAddField(box.id, fieldData);
    closeAddFieldDialog();
  };

  return (
    <Card className="mb-6 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Input
          value={box.title || ""}
          onChange={handleTitleChange}
          className="mr-2 max-w-md"
          placeholder="Título da Seção"
        />
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive hover:bg-destructive/10"
          onClick={() => onDeleteBox(box.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id={`lock-when-signed-${box.id}`}
          checked={box.lockWhenSigned !== false}
          onCheckedChange={handleLockWhenSignedChange}
        />
        <Label htmlFor={`lock-when-signed-${box.id}`}>
          Travar seção após documento ser assinado
        </Label>
      </div>

      <FieldList
        fields={boxFields}
        onEditField={onEditField}
        onDeleteField={onDeleteField}
        onMoveUp={onMoveFieldUp}
        onMoveDown={onMoveFieldDown}
      />

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={openAddFieldDialog}
          className="w-full"
        >
          Adicionar Campo
        </Button>
      </div>

      <AddFieldDialog
        open={isAddFieldDialogOpen}
        onClose={closeAddFieldDialog}
        onAdd={handleAddField}
        isLoading={false}
      />
    </Card>
  );
};

export default FormBoxComponent;
