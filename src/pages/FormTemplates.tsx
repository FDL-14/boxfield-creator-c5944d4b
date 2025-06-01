
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Edit, Trash2, Copy, Eye, Plus } from "lucide-react";
import { DocumentService } from "@/services/documentService";
import { useNavigate } from "react-router-dom";
import MainHeader from "@/components/MainHeader";

const FormTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const documents = await DocumentService.loadDocuments('all', true);
      const formTemplates = documents.filter(doc => doc.isTemplate);
      setTemplates(formTemplates);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar modelos de formulários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: any) => {
    // Navegar para o construtor de formulários com o modelo carregado
    navigate(`/form-builder?template=${template.id}`);
  };

  const handleCopyTemplate = async (template: any) => {
    try {
      const newTemplate = {
        ...template,
        title: `${template.title} - Cópia`,
        name: `${template.title} - Cópia`
      };

      const result = await DocumentService.saveAsTemplate(
        template.formType || 'form-builder',
        newTemplate.title,
        newTemplate,
        template.export_format || 'PDF'
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Modelo copiado com sucesso"
        });
        loadTemplates();
      } else {
        throw new Error(result.error?.message || 'Erro ao copiar');
      }
    } catch (error) {
      console.error("Erro ao copiar modelo:", error);
      toast({
        title: "Erro",
        description: "Erro ao copiar modelo",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este modelo?")) {
      return;
    }

    try {
      const result = await DocumentService.markDocumentAsDeleted(templateId);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Modelo excluído com sucesso"
        });
        loadTemplates();
      } else {
        throw new Error(result.error || 'Erro ao excluir');
      }
    } catch (error) {
      console.error("Erro ao excluir modelo:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir modelo",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = (template: any) => {
    // Navegar para o criador de formulários com este modelo
    navigate(`/form-creator?template=${template.id}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <MainHeader 
        title="Modelos de Formulários" 
        rightContent={
          <img
            src="/lovable-uploads/38edc1d3-2b5d-4e63-be2a-7ead983b2bb8.png"
            alt="Total Data Logo"
            className="h-10 object-contain"
          />
        }
      />

      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Visualize e gerencie os modelos de formulários criados
        </p>
        <Button onClick={() => navigate('/form-builder')}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Modelo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando modelos de formulários...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{template.title || template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description || "Sem descrição"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em: {new Date(template.date || template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Usar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Seções: {template.boxes?.length || 0}</p>
                  <p>Campos: {template.fields?.length || 0}</p>
                  <p>Formato: {template.export_format || 'PDF'}</p>
                </div>
              </div>
            </Card>
          ))}
          
          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum modelo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro modelo de formulário
              </p>
              <Button onClick={() => navigate('/form-builder')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Modelo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormTemplates;
