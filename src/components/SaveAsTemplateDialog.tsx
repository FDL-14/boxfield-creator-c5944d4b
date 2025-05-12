
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveDocumentToSupabase, saveAsTemplate } from "@/utils/documentUtils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";

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
  const [exportFormat, setExportFormat] = useState(initialData?.export_format || "PDF");
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
        export_format: exportFormat,
        updated_at: new Date().toISOString()
      };
      
      // Salvar no Supabase de acordo com a opção selecionada
      const result = saveAsModel
        ? await saveAsTemplate(docType, title, dataToSave, exportFormat)
        : await saveDocumentToSupabase(docType, title, dataToSave, false, exportFormat);
      
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
              placeholder="Descrição do documento..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Formato de Exportação</Label>
            <Select 
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato de exportação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="WORD">Word</SelectItem>
                <SelectItem value="EXCEL">Excel</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Este formato será o padrão para exportação do documento.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveAsModel"
              checked={saveAsModel}
              onChange={(e) => setSaveAsModel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="saveAsModel" className="text-sm font-medium text-gray-700">
              Salvar como modelo
            </Label>
          </div>
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
            type="submit"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
