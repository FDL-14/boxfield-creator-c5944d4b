
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";

export default function AddBoxDialog({ open, onClose, onAdd, isLoading }) {
  const [title, setTitle] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ title });
    setTitle("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="transition-gpu animate-fade-in">
        <DialogHeader>
          <DialogTitle>Nova Seção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da seção"
              className="w-full transition-all duration-300"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!title.trim() || isLoading}
              className="transition-all duration-300 bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Seção
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
