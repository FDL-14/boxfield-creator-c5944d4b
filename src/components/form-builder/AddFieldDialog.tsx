
import React, { useState } from "react";
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
import { Plus, Loader2, Trash2 } from "lucide-react";

const fieldTypes = [
  { value: "short_text", label: "Texto Curto" },
  { value: "long_text", label: "Texto Longo" },
  { value: "checkbox", label: "Caixa de Seleção" },
  { value: "flag", label: "FLAG (Seleção Múltipla)" },
  { value: "flag_with_text", label: "FLAG + Texto" },
  { value: "date", label: "Data" },
  { value: "time", label: "Hora" },
  { value: "signature", label: "Assinatura" },
  { value: "image", label: "Foto/Imagem" }
];

export default function AddFieldDialog({ open, onClose, onAdd, isLoading }) {
  const [field, setField] = useState({
    label: "",
    type: "",
    extra_text: "",
    options: [{text: ""}],
    signature_label: ""
  });

  const handleAddOption = () => {
    setField({
      ...field,
      options: [...field.options, {text: ""}]
    });
  };
  
  const handleRemoveOption = (index) => {
    const newOptions = [...field.options];
    newOptions.splice(index, 1);
    setField({
      ...field,
      options: newOptions
    });
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...field.options];
    newOptions[index].text = value;
    setField({
      ...field,
      options: newOptions
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(field);
    setField({ 
      label: "", 
      type: "", 
      extra_text: "", 
      options: [{text: ""}],
      signature_label: ""
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setField({ 
        label: "", 
        type: "", 
        extra_text: "", 
        options: [{text: ""}],
        signature_label: ""
      });
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

            {(field.type === "flag" || field.type === "flag_with_text") && (
              <div className="space-y-3 p-3 border rounded-lg animate-fade-in">
                <h4 className="font-medium text-sm">Opções de Seleção</h4>
                
                {field.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    
                    {field.options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        disabled={isLoading}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={isLoading}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            )}

            {field.type === "signature" && (
              <Input
                value={field.signature_label}
                onChange={(e) => setField({ ...field, signature_label: e.target.value })}
                placeholder="Nome/Cargo de quem irá assinar"
                disabled={isLoading}
                className="transition-all duration-300 animate-fade-in"
              />
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!field.label.trim() || !field.type || isLoading ||
                ((field.type === "flag" || field.type === "flag_with_text") && 
                field.options.some(opt => !opt.text.trim()))}
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
