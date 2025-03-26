
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSavedForms } from "@/utils/formUtils";
import { Search, FileText, Calendar, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteSavedForm } from "@/utils/formUtils";

interface SavedDocumentsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectDocument: (title: string, doc: any) => void;
  docType: string;
}

export default function SavedDocumentsDialog({
  open,
  onClose,
  onSelectDocument,
  docType
}: SavedDocumentsDialogProps) {
  const { toast } = useToast();
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (open) {
      loadSavedDocuments();
    }
  }, [open, docType]);
  
  const loadSavedDocuments = () => {
    const docs = getSavedForms(docType || "custom");
    setSavedDocuments(docs);
  };
  
  const handleDeleteDocument = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const success = deleteSavedForm(docType || "custom", id);
    
    if (success) {
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso"
      });
      loadSavedDocuments();
    } else {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o documento",
        variant: "destructive"
      });
    }
  };
  
  const filteredDocuments = searchTerm 
    ? savedDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : savedDocuments;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Documentos Salvos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {filteredDocuments.length > 0 ? (
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between border rounded p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => onSelectDocument(doc.name, doc.data)}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(doc.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                Nenhum documento salvo encontrado
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
