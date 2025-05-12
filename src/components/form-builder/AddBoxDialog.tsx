
import React, { useState } from 'react';
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
import { usePermissions } from "@/hooks/usePermissions";

interface AddBoxDialogProps {
  open: boolean;
  onClose: () => void;
  onAddBox: (boxData: any) => void;
  isLoading?: boolean;
}

const AddBoxDialog: React.FC<AddBoxDialogProps> = ({ open, onClose, onAddBox, isLoading = false }) => {
  const [title, setTitle] = useState('');
  const [lockWhenSigned, setLockWhenSigned] = useState(true);
  const { checkPermission } = usePermissions();

  const canEditSection = checkPermission('can_edit_section');

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onAddBox({
      title,
      lockWhenSigned
    });
    
    // Reset form
    setTitle('');
    setLockWhenSigned(true);
  };

  const handleClose = () => {
    setTitle('');
    setLockWhenSigned(true);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Seção</DialogTitle>
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

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Lock className="h-4 w-4 mr-2 text-amber-500" />
              <Label htmlFor="lock-signed">Travar seção após documento ser assinado</Label>
            </div>
            <Switch
              id="lock-signed"
              checked={lockWhenSigned}
              onCheckedChange={setLockWhenSigned}
              disabled={!canEditSection}
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
            {isLoading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBoxDialog;
