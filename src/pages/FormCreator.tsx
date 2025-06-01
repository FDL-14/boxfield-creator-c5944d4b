
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save } from "lucide-react";
import { DocumentService } from "@/services/documentService";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainHeader from "@/components/MainHeader";
import FormRenderer from "@/components/FormRenderer";

const FormCreator = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formValues, setFormValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadTemplates();
    
    // Se há um template ID nos parâmetros da URL, carregá-lo automaticamente
    const templateId = searchParams.get('template');
    if (templateId) {
      loadSpecificTemplate(templateId);
    }
  }, [searchParams]);

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

  const loadSpecificTemplate = async (templateId: string) => {
    try {
      const { document, error } = await DocumentService.getDocumentById(templateId);
      if (error) {
        throw new Error(error);
      }
      if (document) {
        setSelectedTemplate(document);
        setFormTitle(`${document.title} - ${new Date().toLocaleDateString()}`);
      }
    } catch (error) {
      console.error("Erro ao carregar modelo específico:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar modelo específico",
        variant: "destructive"
      });
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormTitle(`${template.title} - ${new Date().toLocaleDateString()}`);
      setFormValues({});
    }
  };

  const handleSaveForm = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Erro",
        description: "Selecione um modelo primeiro",
        variant: "destructive"
      });
      return;
    }

    if (!formTitle.trim()) {
      toast({
        title: "Erro",
        description: "Digite um título para o formulário",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const formData = {
        ...selectedTemplate,
        title: formTitle,
        name: formTitle,
        document_values: formValues,
        template_id: selectedTemplate.id,
        filled_at: new Date().toISOString(),
        export_format: selectedTemplate.export_format || 'PDF'
      };

      const result = await DocumentService.saveDocument(
        selectedTemplate.formType || 'filled-form',
        formTitle,
        formData,
        false, // Não é um modelo
        selectedTemplate.export_format || 'PDF'
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Formulário salvo com sucesso"
        });
        
        // Limpar o formulário
        setFormValues({});
        setFormTitle("");
        setSelectedTemplate(null);
        
        // Navegar para a lista de formulários ou continuar criando
        // navigate('/form-templates');
      } else {
        throw new Error(result.error?.message || 'Erro ao salvar');
      }
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar formulário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <MainHeader 
        title="Criar Novo Formulário" 
        rightContent={
          <img
            src="/lovable-uploads/38edc1d3-2b5d-4e63-be2a-7ead983b2bb8.png"
            alt="Total Data Logo"
            className="h-10 object-contain"
          />
        }
      />

      <div className="space-y-6">
        {/* Template Selection */}
        {!selectedTemplate && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Selecione um Modelo</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-select">Modelo de Formulário</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo de formulário" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {template.title || template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {templates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo disponível</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie primeiro um modelo de formulário no Construtor de Formulários
                  </p>
                  <Button onClick={() => navigate('/form-builder')}>
                    Ir para Construtor de Formulários
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Form Configuration */}
        {selectedTemplate && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Configurar Formulário</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedTemplate(null);
                  setFormValues({});
                  setFormTitle("");
                }}
              >
                Trocar Modelo
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="form-title">Título do Formulário</Label>
                <Input
                  id="form-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Digite o título do formulário"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Modelo:</strong> {selectedTemplate.title}</p>
                <p><strong>Seções:</strong> {selectedTemplate.boxes?.length || 0}</p>
                <p><strong>Campos:</strong> {selectedTemplate.fields?.length || 0}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Form Renderer */}
        {selectedTemplate && formTitle && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Preencher Formulário</h2>
              <Button onClick={handleSaveForm} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Formulário"}
              </Button>
            </div>
            
            <FormRenderer
              boxes={selectedTemplate.boxes || []}
              fields={selectedTemplate.fields || []}
              values={formValues}
              onChange={handleFormChange}
              readonly={false}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default FormCreator;
