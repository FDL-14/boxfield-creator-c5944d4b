import { FormBox, FormField } from "@/entities/all";
import { useToast } from "@/hooks/use-toast";

export const useFormService = () => {
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [boxesData, fieldsData] = await Promise.all([
        FormBox.list("order"),
        FormField.list("order")
      ]);
      return { boxesData, fieldsData };
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as seções e campos",
        variant: "destructive"
      });
      return { boxesData: [], fieldsData: [] };
    }
  };

  const addBox = async (boxData) => {
    try {
      await FormBox.create(boxData);
      toast({
        title: "Seção criada",
        description: "A seção foi criada com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Erro ao criar seção:", error);
      toast({
        title: "Erro ao criar seção",
        description: "Não foi possível criar a seção",
        variant: "destructive"
      });
      return false;
    }
  };

  const addField = async (fieldData, boxId) => {
    try {
      await FormField.create({ ...fieldData, box_id: boxId });
      toast({
        title: "Campo adicionado",
        description: "O campo foi adicionado com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar campo:", error);
      toast({
        title: "Erro ao adicionar campo",
        description: "Não foi possível adicionar o campo",
        variant: "destructive"
      });
      return false;
    }
  };

  const editBox = async (boxId, newData, boxes) => {
    try {
      // Verificar se a seção existe antes de editar
      const boxExists = boxes.find(b => b.id === boxId);
      if (!boxExists) {
        toast({
          title: "Seção não encontrada",
          description: "Esta seção já foi excluída ou não existe mais",
          variant: "destructive"
        });
        return false;
      }

      await FormBox.update(boxId, newData);
      toast({
        title: "Seção atualizada",
        description: "A seção foi atualizada com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Erro ao editar seção:", error);
      toast({
        title: "Erro ao editar seção",
        description: "Não foi possível editar a seção",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteBox = async (boxId, boxes, fields) => {
    try {
      // Verificar se a seção existe antes de excluir
      const boxExists = boxes.find(b => b.id === boxId);
      if (!boxExists) {
        toast({
          title: "Seção não encontrada",
          description: "Esta seção já foi excluída ou não existe mais",
          variant: "destructive"
        });
        return false;
      }

      // Delete all fields in this box first
      const boxFields = fields.filter(f => f.box_id === boxId);
      for (const field of boxFields) {
        await FormField.delete(field.id);
      }
      
      // Now delete the box
      await FormBox.delete(boxId);
      
      toast({
        title: "Seção excluída",
        description: "A seção e seus campos foram excluídos com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Erro ao excluir seção:", error);
      toast({
        title: "Erro ao excluir seção",
        description: "Não foi possível excluir a seção",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteField = async (fieldId, fields) => {
    try {
      // Verificar se o campo existe antes de excluir
      const fieldExists = fields.find(f => f.id === fieldId);
      if (!fieldExists) {
        toast({
          title: "Campo não encontrado",
          description: "Este campo já foi excluído ou não existe mais",
          variant: "destructive"
        });
        return false;
      }

      await FormField.delete(fieldId);
      toast({
        title: "Campo excluído",
        description: "O campo foi excluído com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Erro ao excluir campo:", error);
      toast({
        title: "Erro ao excluir campo",
        description: "Não foi possível excluir o campo",
        variant: "destructive"
      });
      return false;
    }
  };

  const editField = async (fieldId, newData, fields) => {
    try {
      // Verificar se o campo existe antes de editar
      const fieldExists = fields.find(f => f.id === fieldId);
      if (!fieldExists) {
        toast({
          title: "Campo não encontrado",
          description: "Este campo já foi excluído ou não existe mais",
          variant: "destructive"
        });
        return false;
      }

      await FormField.update(fieldId, newData);
      toast({
        title: "Campo atualizado",
        description: "O campo foi atualizado com sucesso"
      });
      return true;
    } catch (error) {
      console.error("Erro ao editar campo:", error);
      toast({
        title: "Erro ao editar campo",
        description: "Não foi possível editar o campo",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateBoxOrder = async (boxId, newOrder) => {
    try {
      await FormBox.update(boxId, { order: newOrder });
      return true;
    } catch (error) {
      console.error("Erro ao atualizar ordem da seção:", error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível atualizar a ordem das seções",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateFieldOrder = async (fieldId, newOrder) => {
    try {
      await FormField.update(fieldId, { order: newOrder });
      return true;
    } catch (error) {
      console.error("Erro ao atualizar ordem do campo:", error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível atualizar a ordem dos campos",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    loadData,
    addBox,
    addField,
    deleteBox,
    deleteField,
    editField,
    editBox,
    updateBoxOrder,
    updateFieldOrder
  };
};
