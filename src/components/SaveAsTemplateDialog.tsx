
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { saveDocumentToSupabase, saveAsTemplate } from "@/utils/documentUtils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  docType: string;
  initialData: any;
}

export default function SaveAsTemplateDialog({
  open,
  onClose,
  onSave,
  docType,
  initialData
}: SaveAsTemplateDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [saveAsModel, setSaveAsModel] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o documento",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Preparar dados para salvar
      const dataToSave = {
        ...initialData,
        title,
        description,
        updated_at: new Date().toISOString()
      };
      
      // Salvar no Supabase de acordo com a opção selecionada
      const result = saveAsModel
        ? await saveAsTemplate(docType, title, dataToSave)
        : await saveDocumentToSupabase(docType, title, dataToSave);
      
      if (result.success) {
        toast({
          title: saveAsModel ? "Modelo salvo" : "Documento salvo",
          description: `${title} foi salvo com sucesso no banco de dados`
        });
        
        onSave({
          ...dataToSave,
          id: result.id || dataToSave.id
        });
        
        onClose();
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao salvar o documento. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro inesperado ao salvar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome do documento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Análise de Risco - Projeto X"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do documento"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="save-as-model"
              checked={saveAsModel}
              onCheckedChange={setSaveAsModel}
            />
            <Label htmlFor="save-as-model">Salvar como modelo</Label>
          </div>
          
          {saveAsModel && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              Ao salvar como modelo, este documento poderá ser usado como base para criar novos documentos.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
