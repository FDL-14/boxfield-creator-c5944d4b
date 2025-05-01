
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormService } from "@/services/formService";
import BoxList from "@/components/form-builder/BoxList";
import AddBoxDialog from "@/components/form-builder/AddBoxDialog";
import AddFieldDialog from "@/components/form-builder/AddFieldDialog";
import FormBuilderHeader from "@/components/form-builder/FormBuilderHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  saveDocumentTypeConfig, 
  loadDocumentTypeConfig, 
  saveFormData, 
  findDuplicateBoxes, 
  findDuplicateFields,
  fixDuplicateIds,
  getLockedSections
} from "@/utils/formUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function FormBuilder() {
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState([]);
  const [fields, setFields] = useState([]);
  const [showAddBox, setShowAddBox] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("Modelo de Formulário Personalizado");
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const { toast } = useToast();
  
  const formService = useFormService();

  useEffect(() => {
    loadData();
  }, []);

  // Verificar duplicações nos dados
  useEffect(() => {
    const duplicateBoxes = findDuplicateBoxes(boxes);
    const duplicateFields = findDuplicateFields(fields);
    
    if (duplicateBoxes.length > 0 || duplicateFields.length > 0) {
      setHasDuplicates(true);
      console.warn("Duplicações detectadas:", {
        boxes: duplicateBoxes,
        fields: duplicateFields
      });
    } else {
      setHasDuplicates(false);
    }
  }, [boxes, fields]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from cached config first
      const savedConfig = loadDocumentTypeConfig();
      if (savedConfig && savedConfig.boxes && savedConfig.fields) {
        console.log("Configuração carregada do localStorage:", savedConfig);
        setBoxes(savedConfig.boxes);
        setFields(savedConfig.fields);
        
        // If there's a title, use it for the template name
        if (savedConfig.title || savedConfig.name) {
          setTemplateName(savedConfig.title || savedConfig.name);
        }
        
        toast({
          title: "Configuração carregada",
          description: "Layout do formulário carregado com sucesso",
        });
      } else {
        // Fall back to service if no cached config
        const { boxesData, fieldsData } = await formService.loadData();
        console.log("Dados carregados do serviço:", { boxesData, fieldsData });
        setBoxes(boxesData);
        setFields(fieldsData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados do formulário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBox = async (boxData) => {
    try {
      setIsLoading(true);
      // Adicionar propriedade lockWhenSigned
      const boxWithLockSettings = {
        ...boxData,
        lockWhenSigned: true // Por padrão, bloquear seção após assinatura
      };
      
      const success = await formService.addBox(boxWithLockSettings);
      if (success) {
        await loadData();
        setShowAddBox(false);
        
        // Save the updated configuration
        const updatedBoxes = [...boxes, boxWithLockSettings];
        saveDocumentTypeConfig({ boxes: updatedBoxes, fields });
        saveCompletedFormType(updatedBoxes, fields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async (fieldData) => {
    try {
      setIsLoading(true);
      const success = await formService.addField(fieldData, selectedBoxId);
      if (success) {
        await loadData();
        setShowAddField(false);
        
        // Save the updated configuration
        const updatedFields = [...fields, {...fieldData, box_id: selectedBoxId}];
        saveDocumentTypeConfig({ boxes, fields: updatedFields });
        saveCompletedFormType(boxes, updatedFields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBox = async (boxId) => {
    try {
      setIsLoading(true);
      const success = await formService.deleteBox(boxId, boxes, fields);
      if (success) {
        await loadData();
        
        // Save the updated configuration
        const updatedBoxes = boxes.filter(box => box.id !== boxId);
        const updatedFields = fields.filter(field => field.box_id !== boxId);
        saveDocumentTypeConfig({ boxes: updatedBoxes, fields: updatedFields });
        saveCompletedFormType(updatedBoxes, updatedFields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      setIsLoading(true);
      const success = await formService.deleteField(fieldId, fields);
      if (success) {
        await loadData();
        
        // Save the updated configuration
        const updatedFields = fields.filter(field => field.id !== fieldId);
        saveDocumentTypeConfig({ boxes, fields: updatedFields });
        saveCompletedFormType(boxes, updatedFields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLockWhenSigned = async (boxId, value) => {
    try {
      setIsLoading(true);
      
      // Update the box in local state
      const updatedBoxes = boxes.map(box => 
        box.id === boxId ? { ...box, lockWhenSigned: value } : box
      );
      
      setBoxes(updatedBoxes);
      
      // Save to service/storage
      await formService.editBox(boxId, { lockWhenSigned: value }, boxes);
      
      // Save the updated configuration
      saveDocumentTypeConfig({ boxes: updatedBoxes, fields, name: templateName, title: templateName });
      saveCompletedFormType(updatedBoxes, fields);
      
      toast({
        title: value ? "Bloqueio ativado" : "Bloqueio desativado",
        description: value ? 
          "Esta seção será bloqueada após assinatura" : 
          "Esta seção não será bloqueada após assinatura"
      });
    } catch (error) {
      console.error("Erro ao atualizar configuração de bloqueio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração de bloqueio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBox = async (boxId, newData) => {
    try {
      setIsLoading(true);
      await formService.editBox(boxId, newData, boxes);
      await loadData();
      
      // Save the updated configuration
      const updatedBoxes = boxes.map(box => 
        box.id === boxId ? { ...box, ...newData } : box
      );
      saveDocumentTypeConfig({ boxes: updatedBoxes, fields, name: templateName, title: templateName });
      saveCompletedFormType(updatedBoxes, fields);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditField = async (fieldId, newData) => {
    try {
      setIsLoading(true);
      const success = await formService.editField(fieldId, newData, fields);
      if (success) {
        await loadData();
        
        // Save the updated configuration
        const updatedFields = fields.map(field => 
          field.id === fieldId ? { ...field, ...newData } : field
        );
        saveDocumentTypeConfig({ boxes, fields: updatedFields });
        saveCompletedFormType(boxes, updatedFields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFieldClick = (boxId) => {
    setSelectedBoxId(boxId);
    setShowAddField(true);
  };

  const handleMoveBox = async (boxId, direction) => {
    try {
      setIsLoading(true);
      const boxIndex = boxes.findIndex(box => box.id === boxId);
      if (boxIndex === -1) return;

      const newBoxes = [...boxes];
      const boxToMove = newBoxes[boxIndex];
      
      if (direction === 'up' && boxIndex > 0) {
        // Swap with the box above
        newBoxes[boxIndex] = newBoxes[boxIndex - 1];
        newBoxes[boxIndex - 1] = boxToMove;
      } else if (direction === 'down' && boxIndex < newBoxes.length - 1) {
        // Swap with the box below
        newBoxes[boxIndex] = newBoxes[boxIndex + 1];
        newBoxes[boxIndex + 1] = boxToMove;
      } else {
        setIsLoading(false);
        return; // Nothing to do
      }
      
      // Update orders
      for (let i = 0; i < newBoxes.length; i++) {
        newBoxes[i].order = i;
        await formService.updateBoxOrder(newBoxes[i].id, i);
      }
      
      setBoxes(newBoxes);
      
      // Save the updated configuration
      saveDocumentTypeConfig({ boxes: newBoxes, fields });
      saveCompletedFormType(newBoxes, fields);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveField = async (fieldId, direction) => {
    try {
      setIsLoading(true);
      const fieldIndex = fields.findIndex(field => field.id === fieldId);
      if (fieldIndex === -1) return;
      
      const field = fields[fieldIndex];
      const boxFields = fields.filter(f => f.box_id === field.box_id);
      const boxFieldIndex = boxFields.findIndex(f => f.id === fieldId);
      
      if (direction === 'up' && boxFieldIndex > 0) {
        // Swap with the field above
        const fieldToSwapWith = boxFields[boxFieldIndex - 1];
        await Promise.all([
          formService.updateFieldOrder(field.id, fieldToSwapWith.order),
          formService.updateFieldOrder(fieldToSwapWith.id, field.order)
        ]);
      } else if (direction === 'down' && boxFieldIndex < boxFields.length - 1) {
        // Swap with the field below
        const fieldToSwapWith = boxFields[boxFieldIndex + 1];
        await Promise.all([
          formService.updateFieldOrder(field.id, fieldToSwapWith.order),
          formService.updateFieldOrder(fieldToSwapWith.id, field.order)
        ]);
      } else {
        setIsLoading(false);
        return; // Nothing to do
      }
      
      await loadData(); // Reload to get the updated order
      
      // Updated fields will be loaded by loadData
      const updatedFields = fields;
      saveDocumentTypeConfig({ boxes, fields: updatedFields });
      saveCompletedFormType(boxes, updatedFields);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLayout = async (boxId, layoutData) => {
    try {
      setIsLoading(true);
      
      // Find the box to update
      const updatedBoxes = boxes.map(box => 
        box.id === boxId ? { ...box, layout: layoutData } : box
      );
      
      // Update in service
      await formService.editBox(boxId, { layout: layoutData }, boxes);
      
      // Update local state
      setBoxes(updatedBoxes);
      
      // Save configuration
      saveDocumentTypeConfig({ boxes: updatedBoxes, fields });
      saveCompletedFormType(updatedBoxes, fields);
      
      toast({
        title: "Layout atualizado",
        description: "As configurações de layout foram salvas"
      });
    } catch (error) {
      console.error("Erro ao atualizar layout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o layout",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixDuplicatesAndSave = () => {
    try {
      // Corrigir duplicações
      const { boxes: fixedBoxes, fields: fixedFields } = fixDuplicateIds(boxes, fields);
      
      // Atualizar estado
      setBoxes(fixedBoxes);
      setFields(fixedFields);
      
      // Salvar com os dados corrigidos
      saveCompletedFormType(fixedBoxes, fixedFields, templateName);
      
      setHasDuplicates(false);
      setShowSaveDialog(false);
      
      toast({
        title: "Duplicações corrigidas",
        description: "Os IDs duplicados foram corrigidos e o modelo foi salvo"
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Erro ao corrigir duplicações:", error);
      toast({
        title: "Erro ao corrigir",
        description: "Não foi possível corrigir as duplicações",
        variant: "destructive"
      });
    }
  };

  const saveCompletedFormType = (boxes, fields, name = templateName) => {
    // Only save if there's content to save
    if (!boxes.length) {
      toast({
        title: "Sem conteúdo",
        description: "Adicione pelo menos uma seção antes de salvar o modelo",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Prepare form data with current timestamp as ID to ensure uniqueness
      const formData = {
        id: Date.now(),
        boxes: boxes,
        fields: fields,
        title: name,
        name: name,
        type: "form-builder",
        date: new Date().toISOString(),
        formType: "form-builder",
        // Inclua os valores dos campos e outras configurações importantes
        document_values: {},
        // Incluir configurações de bloqueio de seções
        section_locks: boxes.map(box => ({
          section_id: box.id,
          lock_when_signed: box.lockWhenSigned !== false
        }))
      };
      
      console.log("Salvando modelo de formulário:", formData);
      
      // Também salvar no Supabase se estiver disponível
      try {
        const user = supabase.auth.getUser();
        if (user) {
          supabase.from('document_templates').insert({
            type: "form-builder",
            title: name,
            data: formData,
            is_template: true
          }).then(response => {
            console.log("Resposta do Supabase:", response);
          });
        }
      } catch (e) {
        console.log("Erro ao salvar no Supabase (ignorando):", e);
      }
      
      // Save as a form type in form-builder category
      const success = saveFormData("form-builder", name, formData);
      
      if (success) {
        console.log("Modelo de formulário salvo com sucesso");
        
        // Salvar na configuração global também para ser usado como padrão
        saveDocumentTypeConfig({
          boxes: boxes,
          fields: fields,
          title: name,
          name: name
        });
        
        return true;
      } else {
        console.error("Erro ao salvar modelo de formulário");
        return false;
      }
    } catch (error) {
      console.error("Erro ao salvar tipo de formulário:", error);
      return false;
    }
  };

  const handleSaveFormLayout = () => {
    // Verificar se há duplicações antes de mostrar o diálogo
    const duplicateBoxes = findDuplicateBoxes(boxes);
    const duplicateFields = findDuplicateFields(fields);
    
    if (duplicateBoxes.length > 0 || duplicateFields.length > 0) {
      setHasDuplicates(true);
      setShowSaveDialog(true);
    } else {
      // Se não houver duplicações, mostrar o diálogo normalmente
      setHasDuplicates(false);
      setShowSaveDialog(true);
    }
  };
  
  const handleConfirmSave = () => {
    setIsLoading(true);
    
    try {
      // Save the current configuration
      if (hasDuplicates) {
        fixDuplicatesAndSave();
      } else {
        const success = saveCompletedFormType(boxes, fields, templateName);
        
        if (success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
          
          toast({
            title: "Layout salvo",
            description: `O modelo "${templateName}" foi salvo com sucesso`
          });
          
          setShowSaveDialog(false);
        } else {
          throw new Error("Falha ao salvar layout");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar layout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o layout do formulário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FormBuilderHeader 
            onAddBox={() => setShowAddBox(true)}
            isLoading={isLoading}
          />
        </div>

        {hasDuplicates && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Atenção: IDs duplicados detectados</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Foram encontrados IDs duplicados nas seções ou campos deste formulário.
                  Isso pode causar problemas ao salvar ou utilizar o modelo. Recomendamos corrigir antes de continuar.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fixDuplicatesAndSave}
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  Corrigir IDs duplicados
                </Button>
              </div>
            </div>
          </div>
        )}

        <BoxList
          boxes={boxes}
          fields={fields}
          onAddField={handleAddFieldClick}
          onDeleteBox={handleDeleteBox}
          onDeleteField={handleDeleteField}
          onEditField={handleEditField}
          onEditBox={handleEditBox}
          onAddBox={() => setShowAddBox(true)}
          onMoveBox={handleMoveBox}
          onMoveField={handleMoveField}
          onUpdateLayout={handleUpdateLayout}
          onToggleLockWhenSigned={handleToggleLockWhenSigned}
          isLoading={isLoading}
        />

        <div className="mt-6 flex justify-between">
          <Button
            onClick={handleSaveFormLayout}
            className={`transition-colors ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isLoading}
          >
            {saveSuccess ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveSuccess ? "Layout Salvo!" : "Salvar Layout"}
          </Button>
          
          <Button
            onClick={() => navigate("/document-creator/form-builder")}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Criar Documento com este Formulário
          </Button>
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
        
        {/* Diálogo para salvar o modelo */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Salvar Modelo de Formulário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Nome do Modelo</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Modelo de Checklist de Inspeção"
                />
              </div>
              
              {hasDuplicates && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Atenção: IDs duplicados detectados</span>
                  </div>
                  <p>
                    Este modelo tem IDs duplicados que serão corrigidos automaticamente durante o salvamento.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
              <Button onClick={handleConfirmSave} disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Modelo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
