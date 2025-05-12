
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (fieldData: any) => void;
  isLoading: boolean;
}

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

const AddFieldDialog: React.FC<AddFieldDialogProps> = ({ open, onClose, onAdd, isLoading }) => {
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
  
  const handleRemoveOption = (index: number) => {
    const newOptions = [...field.options];
    newOptions.splice(index, 1);
    setField({
      ...field,
      options: newOptions
    });
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...field.options];
    newOptions[index].text = value;
    setField({
      ...field,
      options: newOptions
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Garantir que campos de seleção tenham pelo menos duas opções
    if ((field.type === "checkbox" || field.type === "flag" || field.type === "flag_with_text") && 
        field.options.length === 1) {
      // Adicionar uma segunda opção padrão
      const updatedField = {
        ...field,
        options: [...field.options, {text: "Opção 2"}]
      };
      onAdd(updatedField);
    } else {
      onAdd(field);
    }
    
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
  
  // Quando o tipo mudar para um tipo de seleção, garantir que tenha duas opções
  const handleTypeChange = (type: string) => {
    if ((type === "checkbox" || type === "flag" || type === "flag_with_text") && 
        field.options.length < 2) {
      setField({
        ...field,
        type,
        options: [{text: "Opção 1"}, {text: "Opção 2"}]
      });
    } else {
      setField({ ...field, type });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
              className="w-full"
              autoFocus
            />

            <Select
              value={field.type}
              onValueChange={handleTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo do campo" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(field.type === "flag" || field.type === "flag_with_text" || field.type === "checkbox") && (
              <div className="space-y-3 p-3 border rounded-lg">
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
                    
                    {field.options.length > 2 && (
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
                className="w-full"
              />
            )}
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!field.label.trim() || !field.type || isLoading ||
                ((field.type === "flag" || field.type === "flag_with_text" || field.type === "checkbox") && 
                field.options.some(opt => !opt.text.trim()))}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFieldDialog;
