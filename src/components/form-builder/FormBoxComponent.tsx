
import React, { useState } from "react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Lock, Edit, MoveUp, MoveDown } from "lucide-react";
import FieldList from "./FieldList";
import AddFieldDialog from "./AddFieldDialog";
import EditSectionDialog from "./EditSectionDialog";
import { FormBox, FormField } from "@/entities/all";
import { usePermissions } from "@/hooks/usePermissions";

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
  onMoveBoxUp?: (id: string) => void;
  onMoveBoxDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
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
  onMoveBoxUp,
  onMoveBoxDown,
  isFirst = false,
  isLast = false,
}) => {
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
  const boxFields = fields.filter((f) => f.box_id === box.id);
  const { checkPermission } = usePermissions();

  const canEditSection = checkPermission('can_edit_section');
  const canDeleteSection = checkPermission('can_delete_section');
  const canCreateField = checkPermission('can_create_field');

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

  const openEditSectionDialog = () => {
    setIsEditSectionDialogOpen(true);
  };

  const closeEditSectionDialog = () => {
    setIsEditSectionDialogOpen(false);
  };

  const handleAddField = (fieldData: any) => {
    onAddField(box.id, fieldData);
    closeAddFieldDialog();
  };

  const handleSaveSection = (sectionData: any) => {
    onEditBox(box.id, sectionData);
    closeEditSectionDialog();
  };

  return (
    <Card className="mb-6 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Input
          value={box.title || ""}
          onChange={handleTitleChange}
          className="mr-2 max-w-md"
          placeholder="Título da Seção"
          disabled={!canEditSection}
        />
        <div className="flex space-x-2">
          {onMoveBoxUp && !isFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMoveBoxUp(box.id)}
              className="text-gray-600 border-gray-300 hover:bg-gray-100"
            >
              <MoveUp className="h-4 w-4 mr-2" />
              Mover para cima
            </Button>
          )}
          
          {onMoveBoxDown && !isLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMoveBoxDown(box.id)}
              className="text-gray-600 border-gray-300 hover:bg-gray-100"
            >
              <MoveDown className="h-4 w-4 mr-2" />
              Mover para baixo
            </Button>
          )}
          
          {canEditSection && (
            <Button
              variant="outline"
              size="sm"
              onClick={openEditSectionDialog}
              className="text-blue-600 border-blue-600 hover:bg-blue-600/10"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          
          {canDeleteSection && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => onDeleteBox(box.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="flex items-center">
          <Lock className="h-4 w-4 mr-2 text-amber-500" />
          <Label htmlFor={`lock-when-signed-${box.id}`}>
            Travar seção após documento ser assinado
          </Label>
        </div>
        <Switch
          id={`lock-when-signed-${box.id}`}
          checked={box.lockWhenSigned !== false}
          onCheckedChange={handleLockWhenSignedChange}
          disabled={!canEditSection}
        />
      </div>

      <FieldList
        fields={boxFields}
        onEditField={onEditField}
        onDeleteField={onDeleteField}
        onMoveUp={onMoveFieldUp}
        onMoveDown={onMoveFieldDown}
      />

      <div className="mt-4">
        {canCreateField && (
          <Button
            variant="outline"
            onClick={openAddFieldDialog}
            className="w-full"
          >
            Adicionar Campo
          </Button>
        )}
      </div>

      <AddFieldDialog
        open={isAddFieldDialogOpen}
        onClose={closeAddFieldDialog}
        onAdd={handleAddField}
        isLoading={false}
      />

      <EditSectionDialog
        open={isEditSectionDialogOpen}
        onClose={closeEditSectionDialog}
        onSave={handleSaveSection}
        section={box}
        isLoading={false}
      />
    </Card>
  );
};

export default FormBoxComponent;
