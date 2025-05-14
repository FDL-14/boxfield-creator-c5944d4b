
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  isLoading?: boolean;
}

export default function AddFieldDialog({
  open,
  onClose,
  onAdd,
  isLoading = false 
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("short_text");
  const [required, setRequired] = useState(false);

  const handleSubmit = () => {
    if (!label.trim()) return;
    
    onAdd({
      label,
      type,
      required,
      options: (type === "flag" || type === "flag_with_text" || type === "checkbox" || type === "select") 
        ? [{ text: "Opção 1" }, { text: "Opção 2" }] 
        : undefined,
    });
    
    resetForm();
  };

  const resetForm = () => {
    setLabel("");
    setType("short_text");
    setRequired(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Campo</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="field-label">Nome do campo</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nome do campo"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="field-type">Tipo de campo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="field-type">
                <SelectValue placeholder="Selecione o tipo de campo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short_text">Texto Curto</SelectItem>
                <SelectItem value="long_text">Texto Longo</SelectItem>
                <SelectItem value="checkbox">Caixa de Seleção</SelectItem>
                <SelectItem value="flag">FLAG (seleção múltipla)</SelectItem>
                <SelectItem value="flag_with_text">FLAG + Texto</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="time">Hora</SelectItem>
                <SelectItem value="select">Lista Suspensa</SelectItem>
                <SelectItem value="toggle">Botão de Ativar/Inativar</SelectItem>
                <SelectItem value="signature">Assinatura</SelectItem>
                <SelectItem value="image">Foto/Imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="field-required" className="cursor-pointer">
              Campo obrigatório
            </Label>
            <Switch
              id="field-required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!label.trim() || isLoading}
          >
            {isLoading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
