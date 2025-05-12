
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (fieldData: any) => void;
  isLoading?: boolean;
}

const AddFieldDialog: React.FC<AddFieldDialogProps> = ({ 
  open, 
  onClose, 
  onAdd,
  isLoading = false 
}) => {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(false);

  const handleSubmit = () => {
    if (!label.trim()) return;

    onAdd({
      label,
      type,
      required,
    });

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setLabel("");
    setType("text");
    setRequired(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Campo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">Rótulo do Campo</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Rótulo do Campo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Tipo de Campo</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de campo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="checkbox">Caixa de Seleção</SelectItem>
                <SelectItem value="select">Lista de Seleção</SelectItem>
                <SelectItem value="textarea">Área de Texto</SelectItem>
                <SelectItem value="signature">Assinatura</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="field-required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="field-required">Campo Obrigatório</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim() || isLoading}>
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFieldDialog;
