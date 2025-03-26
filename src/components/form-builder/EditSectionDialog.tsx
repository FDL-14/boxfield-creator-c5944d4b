
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface EditSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (newData: any) => void;
  section: any;
  isLoading: boolean;
}

export default function EditSectionDialog({
  open,
  onClose,
  onSave,
  section,
  isLoading
}: EditSectionDialogProps) {
  const [editedSection, setEditedSection] = useState(section);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedSection);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Seção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Título da Seção</Label>
            <Input
              id="section-title"
              value={editedSection.title || editedSection.name || ""}
              onChange={(e) => setEditedSection({ 
                ...editedSection, 
                title: e.target.value,
                name: e.target.value 
              })}
              placeholder="Digite o título da seção"
              required
            />
          </div>
          
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
