
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Pencil, Trash2, Save, FilePlus, FolderTree } from "lucide-react";
import { supabase, processUserProfile } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentService } from "@/services/documentService";
import { AuthService } from "@/services/authService"; // Added import for AuthService
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SavedDocumentsDialog from "@/components/SavedDocumentsDialog";
import MainHeader from "@/components/MainHeader";
import { usePermissions } from "@/hooks/usePermissions";

export default function DocumentTypes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { permissions, checkPermission, isMaster } = usePermissions();
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
  const [documentCategoriesTree, setDocumentCategoriesTree] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [parentCategoryId, setParentCategoryId] = useState(null);
  
  useEffect(() => {
    checkAuth();
    loadDocumentTypes();
    loadFormBuilderTemplates();
    loadDocumentCategories();
  }, []);
  
  const checkAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate('/auth');
        return;
      }
      
      // Get user profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, permissions:user_permissions(*)')
        .eq('id', data.session.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // If there's an error loading the profile, try initializing master user
        if (data.session.user.email === 'fabiano@totalseguranca.net') {
          console.log("Attempting to initialize master user due to profile error");
          const initResult = await AuthService.initMasterUser();
          
          if (initResult.success && initResult.profile) {
            setCurrentUser(processUserProfile({
              ...initResult.profile,
              id: data.session.user.id
            }));
            return;
          }
        }
      }
        
      if (profileData) {
        const processedProfile = processUserProfile({
          ...profileData,
          id: data.session.user.id
        });
        
        setCurrentUser(processedProfile);
      } else if (data.session.user.email === 'fabiano@totalseguranca.net') {
        // If no profile found for master email, try initializing master user
        console.log("No profile found for master email, initializing master user");
        const initResult = await AuthService.initMasterUser();
        
        if (initResult.success && initResult.profile) {
          setCurrentUser(processUserProfile({
            ...initResult.profile,
            id: data.session.user.id
          }));
        }
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Ocorreu um problema ao verificar sua sessão."
      });
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
  
  const loadDocumentCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Convert flat list to hierarchical structure
      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }));
      };
      
      const tree = buildTree(data || []);
      setDocumentCategoriesTree(tree);
    } catch (error) {
      console.error('Error loading document categories:', error);
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
            document_type_id: selectedCategoryId,
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
              document_type_id: selectedCategoryId,
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
      resetForm();
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
  
  const handleSaveCategory = async () => {
    try {
      if (!categoryName.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, informe um nome para a categoria.",
          variant: "destructive"
        });
        return;
      }
      
      setLoading(true);
      
      if (editingCategoryId) {
        // Update existing category
        const { error } = await supabase
          .from('document_types')
          .update({
            name: categoryName,
            description: categoryDescription,
            parent_id: parentCategoryId,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategoryId);
        
        if (error) throw error;
        
        toast({
          title: "Categoria atualizada",
          description: `${categoryName} foi atualizada com sucesso.`,
        });
      } else {
        // Create new category
        const { data: userData } = await supabase.auth.getUser();
      
        const { error } = await supabase
          .from('document_types')
          .insert([
            {
              name: categoryName,
              description: categoryDescription,
              parent_id: parentCategoryId,
              created_by: userData.user?.id
            }
          ]);
        
        if (error) throw error;
        
        toast({
          title: "Nova categoria",
          description: `${categoryName} foi criada com sucesso.`,
        });
      }
      
      setShowCategoriesDialog(false);
      resetCategoryForm();
      loadDocumentCategories();
      
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um problema ao salvar a categoria.",
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
    setSelectedCategoryId(docType.document_type_id);
    setShowDialog(true);
  };

  const handleEditCategory = (category) => {
    if (!canEditDocumentTypes()) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para editar categorias de documento.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setParentCategoryId(category.parent_id);
    setShowCategoriesDialog(true);
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
  
  const handleDeleteCategory = (categoryId) => {
    if (!canEditDocumentTypes()) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para excluir categorias.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedDocTypeId(categoryId);
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
  
  const confirmDeleteCategory = async () => {
    if (!selectedDocTypeId) return;

    try {
      setLoading(true);
      
      // Mark category as deleted rather than actually deleting it
      const { error } = await supabase
        .from('document_types')
        .update({ is_deleted: true })
        .eq('id', selectedDocTypeId);
      
      if (error) throw error;
      
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
      
      loadDocumentCategories();
      setDeleteDialogOpen(false);
      setSelectedDocTypeId(null);
      
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um problema ao excluir a categoria.",
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
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setExportFormat("PDF");
    setSelectedTemplateType("custom");
    setEditingId(null);
    setSelectedCategoryId(null);
  };
  
  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setEditingCategoryId(null);
    setParentCategoryId(null);
  };
  
  const canEditDocumentTypes = () => {
    if (!currentUser) return false;
    
    // Check if user is master or admin
    if (currentUser.is_master || currentUser.is_admin) return true;
    
    // Check specific permission
    if (checkPermission('can_edit_document_type')) return true;
    
    return false;
  };
  
  // Recursive function to render category tree
  const renderCategoryTree = (categories, depth = 0) => {
    if (!categories || categories.length === 0) return null;
    
    return (
      <div className={`ml-${depth * 4}`}>
        {categories.map(category => (
          <div key={category.id} className="mb-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="mr-2">
                  {category.children?.length > 0 ? "📁" : "📄"}
                </span>
                <span>{category.name}</span>
              </div>
              {canEditDocumentTypes() && (
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditCategory(category)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {category.children && category.children.length > 0 && (
              <div className="ml-4 mt-2 pl-2 border-l-2 border-gray-200">
                {renderCategoryTree(category.children, depth + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Recursive function to create category options for select
  const renderCategoryOptions = (categories, depth = 0) => {
    if (!categories || categories.length === 0) return null;
    
    return (
      <>
        {categories.map(category => (
          <React.Fragment key={category.id}>
            <SelectItem value={category.id}>
              {"—".repeat(depth)} {category.name}
            </SelectItem>
            {category.children && category.children.length > 0 && 
              renderCategoryOptions(category.children, depth + 1)
            }
          </React.Fragment>
        ))}
      </>
    );
  };

  // Render a document card
  const renderDocumentCard = (docType, isFormTemplate = false) => {
    // Find category name for this document type if available
    const findCategoryName = (categories, id) => {
      for (const category of categories) {
        if (category.id === id) return category.name;
        if (category.children && category.children.length > 0) {
          const found = findCategoryName(category.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const categoryName = docType.document_type_id ? 
      findCategoryName(documentCategoriesTree, docType.document_type_id) : null;
    
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
            {categoryName && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  Categoria: {categoryName}
                </span>
              </div>
            )}
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
      <MainHeader 
        title="Tipos de Documento" 
        subtitle="Crie e gerencie modelos de documento" 
        rightContent={
          <img
            src="/lovable-uploads/38edc1d3-2b5d-4e63-be2a-7ead983b2bb8.png"
            alt="Total Data Logo"
            className="h-10 object-contain"
          />
        }
      />
      
      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          <Button onClick={() => {
            resetForm();
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

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              resetCategoryForm();
              setShowCategoriesDialog(true);
            }}
          >
            <FolderTree className="mr-2 h-4 w-4" />
            Gerenciar Categorias
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/form-builder')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ir para Construtor de Formulário
          </Button>
        </div>
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
      
      {/* Document Type Form Dialog */}
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
              <label className="text-sm font-medium">Categoria (opcional)</label>
              <Select 
                value={selectedCategoryId || ""}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem categoria</SelectItem>
                  {renderCategoryOptions(documentCategoriesTree)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Formato de Exportação</label>
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
                resetForm();
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
      
      {/* Category Management Dialog */}
      <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategoryId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Nome da categoria"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Descreva a categoria"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria Pai (opcional)</label>
              <Select 
                value={parentCategoryId || ""}
                onValueChange={setParentCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Raiz (Sem pai)</SelectItem>
                  {renderCategoryOptions(documentCategoriesTree)}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCategoriesDialog(false);
                  resetCategoryForm();
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                onClick={handleSaveCategory}
                disabled={loading}
              >
                {loading ? 'Salvando...' : editingCategoryId ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </div>
          
          {!editingCategoryId && (
            <>
              <div className="mt-8 mb-4">
                <h3 className="text-lg font-medium">Categorias Existentes</h3>
                <p className="text-sm text-gray-500">
                  Gerencie suas categorias de documentos
                </p>
              </div>
              
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                {documentCategoriesTree.length > 0 ? (
                  renderCategoryTree(documentCategoriesTree)
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma categoria encontrada
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Item</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O item será permanentemente excluído.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>Tem certeza que deseja excluir este item?</p>
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
