
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSavedForms } from "@/utils/formUtils";
import { Search, FileText, Calendar, Trash2, AlertCircle, Clock, FileCheck, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteSavedForm } from "@/utils/formUtils";
import { Textarea } from "@/components/ui/textarea";

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
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [documentJson, setDocumentJson] = useState("");
  
  useEffect(() => {
    if (open) {
      loadSavedDocuments();
    }
  }, [open, docType]);
  
  const loadSavedDocuments = () => {
    try {
      setLoading(true);
      const docs = getSavedForms(docType || "custom");
      console.log("Documentos carregados:", docs);
      setSavedDocuments(docs);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar a lista de documentos salvos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
  
  const handleViewDocumentDetails = (id: number, document: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(id);
    
    // Prepare JSON data for display
    const formattedJson = JSON.stringify(document, null, 2);
    setDocumentJson(formattedJson);
  };
  
  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(documentJson).then(() => {
      toast({
        title: "JSON copiado",
        description: "JSON do documento copiado para a área de transferência"
      });
    }).catch(err => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o JSON",
        variant: "destructive"
      });
    });
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const filteredDocuments = searchTerm 
    ? savedDocuments.filter(doc => 
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : savedDocuments;
  
  // Sort documents by date (most recent first)
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.date).getTime();
    const dateB = new Date(b.updated_at || b.date).getTime();
    return dateB - dateA;
  });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Documentos Salvos</DialogTitle>
          <DialogDescription>
            Selecione um documento salvo para continuar editando ou visualizar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2 flex-grow">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando documentos...</p>
            </div>
          ) : sortedDocuments.length > 0 ? (
            <ScrollArea className="h-[350px] pr-3">
              <div className="space-y-2">
                {sortedDocuments.map((doc) => {
                  // Get cancellation info, checking both root and data object
                  const isCancelled = doc.cancelled || (doc.data && doc.data.cancelled);
                  const cancellationReason = doc.cancellationReason || (doc.data && doc.data.cancellationReason);
                  
                  // Check if document has boxes and fields data (for form-builder)
                  const hasFormBuilderData = doc.boxes && doc.fields && doc.boxes.length > 0;
                  const hasDataObject = doc.data && Object.keys(doc.data).length > 0;
                  
                  return (
                    <div 
                      key={doc.id} 
                      className={`flex items-center justify-between border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors
                                ${isCancelled ? 'bg-red-50 border-red-200' : ''}`}
                      onClick={() => onSelectDocument(doc.name || doc.title, hasFormBuilderData ? doc : doc.data || doc)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${isCancelled ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {isCancelled ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <FileCheck className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{doc.name || doc.title}</p>
                            {isCancelled && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded whitespace-nowrap">
                                CANCELADO
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                              Criado: {formatDate(doc.date)}
                            </p>
                            {doc.updated_at && doc.updated_at !== doc.date && (
                              <p className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                Atualizado: {formatDate(doc.updated_at)}
                              </p>
                            )}
                            {cancellationReason && (
                              <p className="text-xs text-red-500 flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                Motivo: {cancellationReason}
                              </p>
                            )}
                            {hasFormBuilderData && (
                              <p className="text-xs text-blue-500 flex items-center">
                                <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                                Tipo: Modelo de Formulário ({doc.boxes.length} seções, {doc.fields.length} campos)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleViewDocumentDetails(doc.id, doc, e)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 mr-1 flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchTerm ? "Nenhum documento encontrado com este termo" : "Nenhum documento salvo encontrado"}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Dialog para exibir detalhes do documento */}
      {showDetails !== null && (
        <Dialog 
          open={showDetails !== null} 
          onOpenChange={() => setShowDetails(null)}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Detalhes do Documento</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                readOnly
                value={documentJson}
                className="font-mono text-xs h-[450px]"
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDetails(null)} variant="outline">
                Fechar
              </Button>
              <Button onClick={copyJsonToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar JSON
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
