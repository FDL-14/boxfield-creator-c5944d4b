
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

const fieldTypes = [
  { value: "short_text", label: "Texto Curto" },
  { value: "long_text", label: "Texto Longo" },
  { value: "checkbox", label: "Caixa de Seleção" },
  { value: "checkbox_with_text", label: "Caixa de Seleção com Texto" },
  { value: "date", label: "Data" },
  { value: "time", label: "Hora" },
  { value: "signature", label: "Assinatura" }
];

export default function AddFieldDialog({ open, onClose, onAdd, isLoading }) {
  const [field, setField] = React.useState({
    label: "",
    type: "",
    extra_text: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(field);
    setField({ label: "", type: "", extra_text: "" });
  };

  const handleClose = () => {
    if (!isLoading) {
      setField({ label: "", type: "", extra_text: "" });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="transition-gpu animate-fade-in">
        <DialogHeader>
          <DialogTitle>Novo Campo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              value={field.label}
              onChange={(e) => setField({ ...field, label: e.target.value })}
              placeholder="Rótulo do campo"
              disabled={isLoading}
              className="transition-all duration-300"
              autoFocus
            />

            <Select
              value={field.type}
              onValueChange={(value) => setField({ ...field, type: value })}
              disabled={isLoading}
            >
              <SelectTrigger className="transition-all duration-300">
                <SelectValue placeholder="Selecione o tipo do campo" />
              </SelectTrigger>
              <SelectContent className="transition-all duration-300">
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {field.type === "checkbox_with_text" && (
              <Input
                value={field.extra_text}
                onChange={(e) => setField({ ...field, extra_text: e.target.value })}
                placeholder="Texto adicional para o checkbox"
                disabled={isLoading}
                className="transition-all duration-300 animate-fade-in"
              />
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!field.label.trim() || !field.type || isLoading}
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Campo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
