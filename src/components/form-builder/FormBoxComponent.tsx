
import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Box, Button, Input, MenuItem, Select, Switch, Typography, FormGroup, FormControlLabel } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
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

  const handleLockWhenSignedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditBox(box.id, { lockWhenSigned: e.target.checked });
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
    <Draggable draggableId={box.id} index={index}>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 3,
            p: 2,
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Input
              value={box.title || ""}
              onChange={handleTitleChange}
              fullWidth
              placeholder="Título da Seção"
              sx={{ mr: 2 }}
            />
            <Button
              variant="outlined"
              color="error"
              onClick={() => onDeleteBox(box.id)}
              startIcon={<DeleteIcon />}
              size="small"
            >
              Excluir
            </Button>
          </Box>

          {/* Add section lock option */}
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={box.lockWhenSigned !== false}
                  onChange={handleLockWhenSignedChange}
                />
              }
              label="Travar seção após documento ser assinado"
            />
          </FormGroup>

          <FieldList
            fields={boxFields}
            onEditField={onEditField}
            onDeleteField={onDeleteField}
            onMoveUp={onMoveFieldUp}
            onMoveDown={onMoveFieldDown}
          />

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={openAddFieldDialog}
              fullWidth
            >
              Adicionar Campo
            </Button>
          </Box>

          <AddFieldDialog
            open={isAddFieldDialogOpen}
            onClose={closeAddFieldDialog}
            onAddField={handleAddField}
          />
        </Box>
      )}
    </Draggable>
  );
};

export default FormBoxComponent;
