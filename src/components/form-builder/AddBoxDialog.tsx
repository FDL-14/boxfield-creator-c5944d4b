
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

interface AddBoxDialogProps {
  open: boolean;
  onClose: () => void;
  onAddBox: (boxData: any) => void;
}

const AddBoxDialog: React.FC<AddBoxDialogProps> = ({ open, onClose, onAddBox }) => {
  const [title, setTitle] = useState('');
  const [lockWhenSigned, setLockWhenSigned] = useState(true);

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

          <div className="flex items-center space-x-2">
            <Switch
              id="lock-signed"
              checked={lockWhenSigned}
              onCheckedChange={setLockWhenSigned}
            />
            <Label htmlFor="lock-signed">Travar seção após documento ser assinado</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBoxDialog;
