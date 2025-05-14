
import React, { useState, useEffect } from 'react';
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
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface EditSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (sectionData: any) => void;
  section: any;
  isLoading?: boolean;
}

const EditSectionDialog: React.FC<EditSectionDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  section, 
  isLoading = false 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lockWhenSigned, setLockWhenSigned] = useState(true);

  useEffect(() => {
    if (section) {
      setTitle(section.title || '');
      setDescription(section.description || '');
      setLockWhenSigned(section.lockWhenSigned !== false); // Default to true if not specified
    }
  }, [section]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onSave({
      ...section,
      title,
      description,
      lockWhenSigned
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Seção</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Título da Seção</Label>
            <Input
              id="section-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da Seção"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-description">Descrição (opcional)</Label>
            <Textarea
              id="section-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da seção"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Lock className="h-4 w-4 mr-2 text-amber-500" />
              <Label htmlFor="lock-signed">Travar seção após documento ser assinado</Label>
            </div>
            <Switch
              id="lock-signed"
              checked={lockWhenSigned}
              onCheckedChange={setLockWhenSigned}
            />
          </div>
          <p className="text-xs text-gray-500">
            {lockWhenSigned 
              ? "Esta seção será bloqueada para edição após qualquer assinatura no documento." 
              : "Esta seção continuará editável mesmo após assinaturas no documento."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSectionDialog;
