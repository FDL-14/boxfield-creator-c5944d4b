
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FieldComponentProps {
  field: any;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: any) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isLoading: boolean;
}

const FieldComponent: React.FC<FieldComponentProps> = ({
  field,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  isLoading
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedField, setEditedField] = useState({ ...field });

  const getFieldTypeLabel = (type: string) => {
    const fieldTypes: Record<string, string> = {
      short_text: "Texto Curto",
      long_text: "Texto Longo",
      checkbox: "Caixa de Seleção",
      flag: "FLAG (Seleção Múltipla)",
      flag_with_text: "FLAG + Texto",
      date: "Data",
      time: "Hora",
      signature: "Assinatura",
      image: "Foto/Imagem",
      number: "Número",
      select: "Lista de Seleção"
    };
    return fieldTypes[type] || type;
  };

  const handleOpenEditDialog = () => {
    setEditedField({ ...field });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  const handleEditField = () => {
    onEdit(field.id, editedField);
    setIsEditDialogOpen(false);
  };

  const handleDeleteClick = () => {
    if (confirm("Tem certeza que deseja excluir este campo?")) {
      onDelete(field.id);
    }
  };

  const handleRequiredChange = (checked: boolean) => {
    setEditedField({ ...editedField, required: checked });
  };

  const handleFieldTypeChange = (type: string) => {
    setEditedField({ ...editedField, type });
  };

  return (
    <>
      <Card className="p-3 hover:bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <div className="font-medium flex items-center gap-2">
              {field.label}
              {field.required && (
                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex gap-2 items-center">
              {getFieldTypeLabel(field.type)}
              {field.placeholder && (
                <span className="text-xs text-slate-500">
                  Placeholder: {field.placeholder}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            {onMoveUp && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMoveUp}
                disabled={isLoading}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            
            {onMoveDown && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMoveDown}
                disabled={isLoading}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenEditDialog}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteClick}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Nome do campo</Label>
              <Input
                id="field-label"
                value={editedField.label}
                onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={editedField.placeholder || ""}
                onChange={(e) => setEditedField({ ...editedField, placeholder: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-type">Tipo de Campo</Label>
              <Select 
                value={editedField.type} 
                onValueChange={handleFieldTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_text">Texto Curto</SelectItem>
                  <SelectItem value="long_text">Texto Longo</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="checkbox">Caixa de Seleção</SelectItem>
                  <SelectItem value="flag">FLAG (Seleção Múltipla)</SelectItem>
                  <SelectItem value="flag_with_text">FLAG + Texto</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="time">Hora</SelectItem>
                  <SelectItem value="signature">Assinatura</SelectItem>
                  <SelectItem value="image">Foto/Imagem</SelectItem>
                  <SelectItem value="select">Lista de Seleção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-help">Texto de ajuda (opcional)</Label>
              <Textarea
                id="field-help"
                value={editedField.help_text || ""}
                onChange={(e) => setEditedField({ ...editedField, help_text: e.target.value })}
                placeholder="Texto de ajuda para o usuário"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="required-field"
                checked={editedField.required === true}
                onCheckedChange={handleRequiredChange}
              />
              <Label htmlFor="required-field">Campo obrigatório</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancelar
            </Button>
            <Button onClick={handleEditField} disabled={isLoading || !editedField.label}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FieldComponent;
