
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Trash2, FileText } from "lucide-react";
import { DocumentType } from "@/entities/all";
import { Label } from "@/components/ui/label";

export default function DocumentTypes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    slug: ""
  });

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const types = await DocumentType.list();
      setDocumentTypes(types);
    } catch (error) {
      console.error("Erro ao carregar tipos de documento:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os tipos de documento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenDialog = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormValues({
        name: type.name || "",
        description: type.description || "",
        slug: type.slug || ""
      });
    } else {
      setEditingType(null);
      setFormValues({
        name: "",
        description: "",
        slug: ""
      });
    }
    setDialogOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!formValues.name.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe um nome para o tipo de documento",
          variant: "destructive"
        });
        return;
      }

      // Generate slug if empty
      if (!formValues.slug.trim()) {
        formValues.slug = formValues.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      if (editingType) {
        // Update existing type
        await DocumentType.update(editingType.id, formValues);
        toast({
          title: "Tipo atualizado",
          description: "O tipo de documento foi atualizado com sucesso"
        });
      } else {
        // Create new type
        await DocumentType.create(formValues);
        toast({
          title: "Tipo criado",
          description: "O novo tipo de documento foi criado com sucesso"
        });
      }

      setDialogOpen(false);
      loadDocumentTypes();
    } catch (error) {
      console.error("Erro ao salvar tipo de documento:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o tipo de documento",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este tipo de documento?")) {
      try {
        await DocumentType.delete(id);
        toast({
          title: "Tipo excluído",
          description: "O tipo de documento foi excluído com sucesso"
        });
        loadDocumentTypes();
      } catch (error) {
        console.error("Erro ao excluir tipo de documento:", error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o tipo de documento",
          variant: "destructive"
        });
      }
    }
  };

  const handleCreateDocument = (type) => {
    navigate(`/document-creator/${type.slug || type.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Tipos de Documento</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Gerencie os tipos de documento disponíveis no sistema
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>

        {/* Document Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Types */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Construtor de Formulário
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-gray-500 text-sm">
                Crie e gerencie campos e seções do seu formulário personalizado.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/form-builder")}>
                Editar
              </Button>
              <Button size="sm" onClick={() => navigate("/document-creator/form-builder")}>
                Criar Documento
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Análise de Risco
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-gray-500 text-sm">
                Crie documentos para análise de riscos em atividades.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/analise-risco")}>
                Editar
              </Button>
              <Button size="sm" onClick={() => navigate("/document-creator/analise-risco")}>
                Criar Documento
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Permissão de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-gray-500 text-sm">
                Crie documentos de permissão de trabalho para atividades.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/permissao-trabalho")}>
                Editar
              </Button>
              <Button size="sm" onClick={() => navigate("/document-creator/permissao-trabalho")}>
                Criar Documento
              </Button>
            </CardFooter>
          </Card>

          {/* Custom Document Types */}
          {documentTypes.map(type => (
            <Card key={type.id} className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  {type.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-gray-500 text-sm">
                  {type.description || "Documento personalizado"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleOpenDialog(type)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" onClick={() => handleCreateDocument(type)}>
                  Criar Documento
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {documentTypes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Você ainda não possui tipos de documento personalizados.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Tipo
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="block mb-2">Nome</Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nome do tipo de documento"
              />
            </div>
            <div>
              <Label htmlFor="description" className="block mb-2">Descrição</Label>
              <Input
                id="description"
                value={formValues.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição breve do tipo de documento"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="block mb-2">Identificador URL (opcional)</Label>
              <Input
                id="slug"
                value={formValues.slug}
                onChange={(e) => handleInputChange("slug", e.target.value.replace(/\s+/g, '-').toLowerCase())}
                placeholder="identificador-url"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para gerar automaticamente
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingType ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
