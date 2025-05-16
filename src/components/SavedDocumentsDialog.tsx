
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentService } from "@/services/documentService";
import { getSavedForms, prepareFormTemplate, deleteSavedForm } from "@/utils/formUtils";
import { Search, FileText, Calendar, Trash2, AlertCircle, Clock, FileCheck, Copy, Loader2, User, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

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
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [documentJson, setDocumentJson] = useState("");
  const [filterType, setFilterType] = useState(docType === "all" ? "all" : docType);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    if (open) {
      loadSavedDocuments();
      checkCurrentUser();
    }
  }, [open, filterType]);
  
  const checkCurrentUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setCurrentUser(data.session.user);
    }
  };

  const loadUserProfiles = async (userIds: string[]) => {
    if (!userIds.length) return;

    const uniqueIds = [...new Set(userIds.filter(id => id && !userProfiles[id]))];
    if (!uniqueIds.length) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', uniqueIds);

      if (!error && data) {
        const newProfiles = { ...userProfiles };
        data.forEach(profile => {
          newProfiles[profile.id] = profile;
        });
        setUserProfiles(newProfiles);
      }
    } catch (error) {
      console.error("Erro ao carregar perfis de usuários:", error);
    }
  };
  
  const loadSavedDocuments = async () => {
    try {
      setLoading(true);
      // Carregar documentos usando DocumentService
      const docs = await DocumentService.loadDocuments(filterType === "all" ? "all" : filterType);
      console.log("Documentos carregados:", docs);
      setSavedDocuments(docs);

      // Carregar perfis de usuários criadores dos documentos
      const userIds = docs
        .map(doc => doc.created_by || (doc.data && doc.data.created_by))
        .filter(Boolean);
      
      await loadUserProfiles(userIds);
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
  
  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    
    try {
      // Use DocumentService para marcar como excluído
      const success = await DocumentService.markDocumentAsDeleted(id);
      
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
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o documento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDocumentDetails = (id: string, document: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(id);
    
    // Prepare JSON data for display
    const formattedJson = JSON.stringify(document, null, 2);
    setDocumentJson(formattedJson);
  };
  
  const handleSelectDocument = (name: string, document: any) => {
    console.log("Selecting document:", document);
    // For form-builder templates, prepare the template first
    if (document.formType === 'form-builder' && document.isTemplate) {
      const preparedTemplate = prepareFormTemplate(document);
      onSelectDocument(name, preparedTemplate || document);
    } else {
      onSelectDocument(name, document);
    }
    onClose();
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
  
  const getDocTypeBadge = (type: string) => {
    switch(type) {
      case 'form-builder':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">FORMULÁRIO</Badge>;
      case 'custom':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">DOCUMENTO</Badge>;
      default:
        return <Badge variant="outline">{type?.toUpperCase()}</Badge>;
    }
  };

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "Usuário desconhecido";
    if (userProfiles[userId]) return userProfiles[userId].name;
    return "Usuário " + userId.substring(0, 4);
  };
  
  const canDeleteDocument = (doc: any) => {
    // Se não tem usuário atual, não pode excluir
    if (!currentUser) return false;
    
    // Se o documento foi criado pelo usuário atual, pode excluir
    if (doc.created_by === currentUser.id) return true;

    // Adicionar verificação de permissões aqui, quando disponível
    // Por enquanto, permitir exclusão de documentos sem criador definido
    return !doc.created_by;
  };
  
  const filteredDocuments = searchTerm 
    ? savedDocuments.filter(doc => 
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {docType === "all" && (
              <Select 
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="form-builder">Formulários</SelectItem>
                  <SelectItem value="custom">Documentos</SelectItem>
                </SelectContent>
              </Select>
            )}
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
                  const isTemplate = doc.isTemplate || false;
                  
                  // Determine the data to pass when clicked
                  const documentToPass = hasFormBuilderData ? doc : (doc.data && Object.keys(doc.data).length > 0) ? doc.data : doc;
                  
                  // Get the ID to use
                  const docId = doc.supabaseId || doc.id || "";
                  
                  // Get document type
                  const docType = doc.formType || doc.type || "custom";

                  // Get creator info
                  const creatorId = doc.created_by || (doc.data && doc.data.created_by);
                  const creatorName = getUserName(creatorId);
                  
                  return (
                    <div 
                      key={docId} 
                      className={`flex items-center justify-between border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors
                                ${isCancelled ? 'bg-red-50 border-red-200' : ''}
                                ${isTemplate ? 'bg-blue-50 border-blue-200' : ''}`}
                      onClick={() => handleSelectDocument(doc.name || doc.title, documentToPass)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className={`p-2 rounded-md ${isCancelled ? 'bg-red-100' : isTemplate ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {isCancelled ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : isTemplate ? (
                            <FileText className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FileCheck className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{doc.name || doc.title}</p>
                            {isCancelled && (
                              <Badge variant="destructive" className="text-xs whitespace-nowrap">
                                CANCELADO
                              </Badge>
                            )}
                            {isTemplate && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap border-blue-200">
                                MODELO
                              </Badge>
                            )}
                            {getDocTypeBadge(docType)}
                            {doc.supabaseId && (
                              <Badge variant="secondary" className="text-xs whitespace-nowrap flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                BANCO DE DADOS
                              </Badge>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-sm text-gray-500 truncate mt-1">{doc.description}</p>
                          )}
                          <div className="flex flex-col gap-1 mt-1">
                            {creatorId && (
                              <p className="text-xs text-gray-500 flex items-center">
                                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                Criado por: {creatorName}
                              </p>
                            )}
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
                                Tipo: {isTemplate ? "Modelo de Formulário" : "Formulário"} 
                                ({doc.boxes?.length || 0} seções, {doc.fields?.length || 0} campos)
                              </p>
                            )}
                            {doc.export_format && (
                              <p className="text-xs text-gray-500 flex items-center">
                                <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                                Formato: {doc.export_format}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleViewDocumentDetails(docId, doc, e)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 mr-1 flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {canDeleteDocument(doc) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteDocument(docId, e)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
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

      {/* Dialog for viewing document details */}
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
