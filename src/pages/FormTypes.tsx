
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DocumentService } from "@/services/documentService";
import MainHeader from "@/components/MainHeader";

const FormTypes = () => {
  const [types, setTypes] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFormTypes();
  }, []);

  const loadFormTypes = async () => {
    try {
      setLoading(true);
      const documents = await DocumentService.loadDocuments('all', true);
      const formTypes = documents.filter(doc => doc.isTemplate);
      setTypes(formTypes);
    } catch (error) {
      console.error("Erro ao carregar tipos de formulários:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de formulários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do tipo de formulário é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const result = await DocumentService.saveDocument(
        'form-type',
        newType.name,
        {
          name: newType.name,
          description: newType.description,
          boxes: [],
          fields: [],
          export_format: 'PDF'
        },
        true,
        'PDF'
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Tipo de formulário criado com sucesso"
        });
        setNewType({ name: "", description: "" });
        setIsAddDialogOpen(false);
        loadFormTypes();
      } else {
        throw new Error(result.error?.message || 'Erro ao salvar');
      }
    } catch (error) {
      console.error("Erro ao criar tipo:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar tipo de formulário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditType = async () => {
    if (!editingType?.name?.trim()) {
      toast({
        title: "Erro",
        description: "Nome do tipo de formulário é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const result = await DocumentService.saveDocument(
        'form-type',
        editingType.name,
        {
          ...editingType,
          name: editingType.name,
          description: editingType.description
        },
        true,
        editingType.export_format || 'PDF'
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Tipo de formulário atualizado com sucesso"
        });
        setIsEditDialogOpen(false);
        setEditingType(null);
        loadFormTypes();
      } else {
        throw new Error(result.error?.message || 'Erro ao salvar');
      }
    } catch (error) {
      console.error("Erro ao editar tipo:", error);
      toast({
        title: "Erro",
        description: "Erro ao editar tipo de formulário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de formulário?")) {
      return;
    }

    try {
      setLoading(true);
      const result = await DocumentService.markDocumentAsDeleted(id);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Tipo de formulário excluído com sucesso"
        });
        loadFormTypes();
      } else {
        throw new Error(result.error || 'Erro ao excluir');
      }
    } catch (error) {
      console.error("Erro ao excluir tipo:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de formulário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <MainHeader 
        title="Gerenciar Tipos de Formulários" 
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
          Configure e gerencie os tipos de formulários disponíveis no sistema
        </p>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando tipos de formulários...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <Card key={type.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{type.title || type.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description || "Sem descrição"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em: {new Date(type.date || type.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingType(type);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteType(type.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {types.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum tipo de formulário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro tipo de formulário
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Tipo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Type Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Formulário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Tipo</Label>
              <Input
                id="name"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="Digite o nome do tipo de formulário"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Digite uma descrição para o tipo de formulário"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddType} disabled={loading}>
              {loading ? "Criando..." : "Criar Tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Formulário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Tipo</Label>
              <Input
                id="edit-name"
                value={editingType?.name || ''}
                onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                placeholder="Digite o nome do tipo de formulário"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editingType?.description || ''}
                onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                placeholder="Digite uma descrição para o tipo de formulário"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditType} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormTypes;
