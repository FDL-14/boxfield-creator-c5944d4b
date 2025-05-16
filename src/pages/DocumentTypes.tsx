import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Pencil, Trash2, Save, FilePlus } from "lucide-react";
import { supabase, processUserProfile } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { DocumentService } from "@/services/documentService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SavedDocumentsDialog from "@/components/SavedDocumentsDialog";

export default function DocumentTypes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exportFormat, setExportFormat] = useState("PDF");
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSavedDocsDialog, setShowSavedDocsDialog] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState("custom");
  
  useEffect(() => {
    checkAuth();
    loadDocumentTypes();
    loadFormBuilderTemplates();
  }, []);
  
  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    
    if (!data.session) {
      navigate('/auth');
      return;
    }
    
    // Get user profile info
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, permissions:user_permissions(*)')
      .eq('id', data.session.user.id)
      .single();
      
    if (profileData) {
      const processedProfile = processUserProfile({
        ...profileData,
        id: data.session.user.id
      });
      
      setCurrentUser(processedProfile);
    }
  };
  
  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_template', true)
        .eq('is_deleted', false)
        .eq('type', 'custom')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error) {
      console.error('Error loading document types:', error);
      toast({
        title: "Erro ao carregar tipos de documento",
        description: "Ocorreu um problema ao buscar os tipos de documento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadFormBuilderTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_template', true)
        .eq('is_deleted', false)
        .eq('type', 'form-builder')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFormTemplates(data || []);
    } catch (error) {
      console.error('Error loading form templates:', error);
    }
  };
  
  const handleCreateNew = async () => {
    try {
      if (!title.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, informe um título para o tipo de documento.",
          variant: "destructive"
        });
        return;
      }
      
      setLoading(true);
      
      if (editingId) {
        // Update existing document type
        const { error } = await supabase
          .from('document_templates')
          .update({
            title,
            description,
            export_format: exportFormat,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
        
        if (error) throw error;
        
        toast({
          title: "Tipo de documento atualizado",
          description: `${title} foi atualizado com sucesso.`,
        });
      } else {
        // Create new document type
        const { data: userData } = await supabase.auth.getUser();
      
        const { error } = await supabase
          .from('document_templates')
          .insert([
            {
              title,
              description,
              type: selectedTemplateType,
              data: { sections: [] },
              is_template: true,
              export_format: exportFormat,
              created_by: userData.user?.id
            }
          ]);
        
        if (error) throw error;
        
        toast({
          title: "Novo tipo de documento",
          description: `${title} foi criado com sucesso.`,
        });
      }
      
      setShowDialog(false);
      setTitle("");
      setDescription("");
      setExportFormat("PDF");
      setSelectedTemplateType("custom");
      setEditingId(null);
      loadDocumentTypes();
      loadFormBuilderTemplates();
      
    } catch (error) {
      console.error('Error saving document type:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um problema ao salvar o tipo de documento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (docType) => {
    if (!canEditDocumentTypes()) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para editar tipos de documento.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingId(docType.id);
    setTitle(docType.title);
    setDescription(docType.description || "");
    setExportFormat(docType.export_format || "PDF");
    setSelectedTemplateType(docType.type || "custom");
    setShowDialog(true);
  };

  const handleDelete = (docTypeId) => {
    if (!canEditDocumentTypes()) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para excluir tipos de documento.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedDocTypeId(docTypeId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocTypeId) return;

    try {
      setLoading(true);
      
      // Mark document as deleted rather than actually deleting it
      const { error } = await supabase
        .from('document_templates')
        .update({ is_deleted: true })
        .eq('id', selectedDocTypeId);
      
      if (error) throw error;
      
      toast({
        title: "Tipo de documento excluído",
        description: "O tipo de documento foi excluído com sucesso.",
      });
      
      loadDocumentTypes();
      loadFormBuilderTemplates();
      setDeleteDialogOpen(false);
      setSelectedDocTypeId(null);
      
    } catch (error) {
      console.error('Error deleting document type:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um problema ao excluir o tipo de documento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateDocument = (templateId) => {
    navigate(`/document-creator/${templateId}`);
  };
  
  const handleOpenFormBuilder = (templateId) => {
    navigate(`/form-builder?template=${templateId}`);
  };
  
  const handleDocumentSelected = (title, document) => {
    // Use the selected document as a template
    console.log("Selected document:", document);
    // Implementation depends on what you want to do with the selected document
  };
  
  const canEditDocumentTypes = () => {
    if (!currentUser) return false;
    
    // Check if user is master or admin
    if (currentUser.is_master || currentUser.is_admin) return true;
    
    // Check specific permission
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions[0].can_edit_document_type === true;
    }
    
    return false;
  };

  // Render a document card
  const renderDocumentCard = (docType, isFormTemplate = false) => {
    return (
      <Card key={docType.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${isFormTemplate ? 'bg-blue-100' : 'bg-primary/10'} rounded-lg`}>
                <FileText className={`h-6 w-6 ${isFormTemplate ? 'text-blue-600' : 'text-primary'}`} />
              </div>
              <div className="flex space-x-2">
                {canEditDocumentTypes() && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(docType)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(docType.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">{docType.title}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {docType.description || "Sem descrição"}
            </p>
            {docType.export_format && (
              <div className="mb-4">
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  Formato: {docType.export_format || "PDF"}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant={isFormTemplate ? "outline" : "default"} 
              className="w-full"
              onClick={() => isFormTemplate ? handleOpenFormBuilder(docType.id) : handleCreateDocument(docType.id)}
            >
              {isFormTemplate ? "Editar Formulário" : "Criar Documento"}
            </Button>
            
            {isFormTemplate && (
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => handleCreateDocument(docType.id)}
              >
                Usar como Modelo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Header 
        title="Tipos de Documento" 
        subtitle="Crie e gerencie modelos de documento" 
      />
      
      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingId(null);
            setTitle("");
            setDescription("");
            setExportFormat("PDF");
            setSelectedTemplateType("custom");
            setShowDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo de Documento
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowSavedDocsDialog(true)}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Ver Documentos Salvos
          </Button>
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate('/form-builder')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ir para Construtor de Formulário
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {formTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Formulários Disponíveis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formTemplates.map((template) => renderDocumentCard(template, true))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">Tipos de Documento</h2>
          {documentTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentTypes.map((docType) => renderDocumentCard(docType))}
            </div>
          ) : (
            <Card className="text-center p-6">
              <CardContent className="pt-10 pb-10 flex flex-col items-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum tipo de documento</h3>
                <p className="text-gray-500 mb-6">
                  Crie seu primeiro tipo de documento para começar.
                </p>
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Tipo de Documento
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Template</label>
              <Select 
                value={selectedTemplateType}
                onValueChange={setSelectedTemplateType}
                disabled={editingId !== null}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Documento Customizado</SelectItem>
                  <SelectItem value="form-builder">Formulário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Ex: Análise Preliminar de Risco"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Descreva o propósito deste tipo de documento"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Formato de Exporta��ão</label>
              <Select 
                value={exportFormat}
                onValueChange={setExportFormat}
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
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setTitle("");
                setDescription("");
                setExportFormat("PDF");
                setSelectedTemplateType("custom");
                setEditingId(null);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleCreateNew}
              disabled={loading}
            >
              {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Tipo de Documento</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O tipo de documento será permanentemente excluído.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>Tem certeza que deseja excluir este tipo de documento?</p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedDocTypeId(null);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Documents Dialog */}
      <SavedDocumentsDialog
        open={showSavedDocsDialog}
        onClose={() => setShowSavedDocsDialog(false)}
        onSelectDocument={handleDocumentSelected}
        docType="all"
      />
    </div>
  );
}
