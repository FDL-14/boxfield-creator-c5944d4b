
import React, { useState, useEffect } from "react";
import { FormBox, FormField } from "@/entities/all";
import { Button } from "@/components/ui/button";
import FormBoxComponent from "../components/form-builder/FormBoxComponent";
import AddBoxDialog from "../components/form-builder/AddBoxDialog";
import AddFieldDialog from "../components/form-builder/AddFieldDialog";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FormBuilder() {
  const [boxes, setBoxes] = useState([]);
  const [fields, setFields] = useState([]);
  const [showAddBox, setShowAddBox] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [boxesData, fieldsData] = await Promise.all([
        FormBox.list("order"),
        FormField.list("order")
      ]);
      setBoxes(boxesData);
      setFields(fieldsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as seções e campos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBox = async (boxData) => {
    try {
      setIsLoading(true);
      await FormBox.create(boxData);
      await loadData();
      setShowAddBox(false);
      toast({
        title: "Seção criada",
        description: "A seção foi criada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao criar seção:", error);
      toast({
        title: "Erro ao criar seção",
        description: "Não foi possível criar a seção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async (fieldData) => {
    try {
      setIsLoading(true);
      await FormField.create({ ...fieldData, box_id: selectedBoxId });
      await loadData();
      setShowAddField(false);
      toast({
        title: "Campo adicionado",
        description: "O campo foi adicionado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao adicionar campo:", error);
      toast({
        title: "Erro ao adicionar campo",
        description: "Não foi possível adicionar o campo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBox = async (boxId) => {
    try {
      setIsLoading(true);
      // Verificar se a seção existe antes de excluir
      const boxExists = boxes.find(b => b.id === boxId);
      if (!boxExists) {
        toast({
          title: "Seção não encontrada",
          description: "Esta seção já foi excluída ou não existe mais",
          variant: "destructive"
        });
        await loadData(); // Recarregar dados para atualizar a interface
        return;
      }

      // Delete all fields in this box first
      const boxFields = fields.filter(f => f.box_id === boxId);
      for (const field of boxFields) {
        await FormField.delete(field.id);
      }
      
      // Now delete the box
      await FormBox.delete(boxId);
      
      await loadData();
      toast({
        title: "Seção excluída",
        description: "A seção e seus campos foram excluídos com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir seção:", error);
      toast({
        title: "Erro ao excluir seção",
        description: "Não foi possível excluir a seção",
        variant: "destructive"
      });
      await loadData(); // Recarregar dados para atualizar a interface
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      setIsLoading(true);
      // Verificar se o campo existe antes de excluir
      const fieldExists = fields.find(f => f.id === fieldId);
      if (!fieldExists) {
        toast({
          title: "Campo não encontrado",
          description: "Este campo já foi excluído ou não existe mais",
          variant: "destructive"
        });
        await loadData(); // Recarregar dados para atualizar a interface
        return;
      }

      await FormField.delete(fieldId);
      await loadData();
      toast({
        title: "Campo excluído",
        description: "O campo foi excluído com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir campo:", error);
      toast({
        title: "Erro ao excluir campo",
        description: "Não foi possível excluir o campo",
        variant: "destructive"
      });
      await loadData(); // Recarregar dados para atualizar a interface
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditField = async (fieldId, newData) => {
    try {
      setIsLoading(true);
      // Verificar se o campo existe antes de editar
      const fieldExists = fields.find(f => f.id === fieldId);
      if (!fieldExists) {
        toast({
          title: "Campo não encontrado",
          description: "Este campo já foi excluído ou não existe mais",
          variant: "destructive"
        });
        await loadData(); // Recarregar dados para atualizar a interface
        return;
      }

      await FormField.update(fieldId, newData);
      await loadData();
      toast({
        title: "Campo atualizado",
        description: "O campo foi atualizado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao editar campo:", error);
      toast({
        title: "Erro ao editar campo",
        description: "Não foi possível editar o campo",
        variant: "destructive"
      });
      await loadData(); // Recarregar dados para atualizar a interface
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="animate-slide-down">
            <h1 className="text-3xl font-bold text-gray-900">Construtor de Formulário</h1>
            <p className="text-gray-500 mt-1">
              Crie e gerencie campos e seções do seu formulário
            </p>
          </div>
          <Button 
            onClick={() => setShowAddBox(true)}
            className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 animate-fade-in"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Nova Seção
          </Button>
        </div>

        <div className="space-y-6">
          {boxes.map(box => (
            <FormBoxComponent
              key={box.id}
              box={box}
              fields={fields.filter(f => f.box_id === box.id)}
              onAddField={() => {
                setSelectedBoxId(box.id);
                setShowAddField(true);
              }}
              onDeleteBox={() => handleDeleteBox(box.id)}
              onDeleteField={handleDeleteField}
              onEditField={handleEditField}
              isLoading={isLoading}
            />
          ))}

          {boxes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed animate-fade-in transition-all duration-300">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma seção criada
              </h3>
              <p className="text-gray-500 mb-4">
                Comece criando uma nova seção para seu formulário
              </p>
              <Button
                onClick={() => setShowAddBox(true)}
                variant="outline"
                disabled={isLoading}
                className="transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Primeira Seção
              </Button>
            </div>
          )}
        </div>

        <AddBoxDialog
          open={showAddBox}
          onClose={() => setShowAddBox(false)}
          onAdd={handleAddBox}
          isLoading={isLoading}
        />

        <AddFieldDialog
          open={showAddField}
          onClose={() => setShowAddField(false)}
          onAdd={handleAddField}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
