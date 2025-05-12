import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import BoxList from "@/components/form-builder/BoxList";
import AddBoxDialog from "@/components/form-builder/AddBoxDialog";
import { useFormService } from "@/services/formService";
import { saveDocumentTypeConfig, loadDocumentTypeConfig } from "@/utils/formUtils";
import ExportFormatSelector from "@/components/ExportFormatSelector";

const FormBuilder = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [isAddBoxDialogOpen, setIsAddBoxDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("PDF");
  const { loadData, addBox, addField, editBox, deleteBox, editField, deleteField, updateBoxOrder, updateFieldOrder } = useFormService();

  useEffect(() => {
    const loadInitialData = async () => {
      // First try to load from saved config
      const savedConfig = loadDocumentTypeConfig();
      if (savedConfig) {
        setBoxes(savedConfig.boxes || []);
        setFields(savedConfig.fields || []);
        setExportFormat(savedConfig.export_format || "PDF");
      } else {
        // Otherwise load from the service
        const { boxesData, fieldsData } = await loadData();
        setBoxes(boxesData || []);
        setFields(fieldsData || []);
      }
    };

    loadInitialData();
  }, []);

  const handleAddBox = async (boxData: any) => {
    const newBox = await addBox({
      ...boxData,
      id: uuidv4(),
      order: boxes.length,
      lockWhenSigned: boxData.lockWhenSigned !== false, // Default to true if not specified
    });
    if (newBox) {
      setBoxes([...boxes, newBox]);
    }
    setIsAddBoxDialogOpen(false);
  };

  const handleDeleteBox = async (id: string) => {
    const success = await deleteBox(id, boxes, fields);
    if (success) {
      setBoxes(boxes.filter((box) => box.id !== id));
      setFields(fields.filter((field) => field.box_id !== id));
    }
  };

  const handleEditBox = async (id: string, data: any) => {
    const success = await editBox(id, data, boxes);
    if (success) {
      setBoxes(
        boxes.map((box) => (box.id === id ? { ...box, ...data } : box))
      );
    }
  };

  const handleAddField = async (boxId: string, fieldData: any) => {
    const boxFields = fields.filter((f) => f.box_id === boxId);
    const newField = await addField(
      {
        ...fieldData,
        id: uuidv4(),
        order: boxFields.length,
        box_id: boxId,
      },
      boxId
    );
    if (newField) {
      setFields([...fields, newField]);
    }
  };

  const handleEditField = async (id: string, data: any) => {
    const success = await editField(id, data, fields);
    if (success) {
      setFields(
        fields.map((field) => (field.id === id ? { ...field, ...data } : field))
      );
    }
  };

  const handleDeleteField = async (id: string) => {
    const success = await deleteField(id, fields);
    if (success) {
      setFields(fields.filter((field) => field.id !== id));
    }
  };

  const handleMoveFieldUp = (id: string) => {
    const fieldIndex = fields.findIndex((f) => f.id === id);
    const field = fields[fieldIndex];
    const boxFields = fields
      .filter((f) => f.box_id === field.box_id)
      .sort((a, b) => a.order - b.order);
    
    const fieldBoxIndex = boxFields.findIndex((f) => f.id === id);
    
    if (fieldBoxIndex <= 0) return; // Already at the top
    
    const newBoxFields = [...boxFields];
    // Swap with previous field
    const temp = newBoxFields[fieldBoxIndex].order;
    newBoxFields[fieldBoxIndex].order = newBoxFields[fieldBoxIndex - 1].order;
    newBoxFields[fieldBoxIndex - 1].order = temp;
    
    // Update backend
    updateFieldOrder(newBoxFields[fieldBoxIndex].id, newBoxFields[fieldBoxIndex].order);
    updateFieldOrder(newBoxFields[fieldBoxIndex - 1].id, newBoxFields[fieldBoxIndex - 1].order);
    
    // Update state
    const newFields = fields.filter((f) => f.box_id !== field.box_id).concat(newBoxFields);
    setFields(newFields);
  };

  const handleMoveFieldDown = (id: string) => {
    const fieldIndex = fields.findIndex((f) => f.id === id);
    const field = fields[fieldIndex];
    const boxFields = fields
      .filter((f) => f.box_id === field.box_id)
      .sort((a, b) => a.order - b.order);
    
    const fieldBoxIndex = boxFields.findIndex((f) => f.id === id);
    
    if (fieldBoxIndex >= boxFields.length - 1) return; // Already at the bottom
    
    const newBoxFields = [...boxFields];
    // Swap with next field
    const temp = newBoxFields[fieldBoxIndex].order;
    newBoxFields[fieldBoxIndex].order = newBoxFields[fieldBoxIndex + 1].order;
    newBoxFields[fieldBoxIndex + 1].order = temp;
    
    // Update backend
    updateFieldOrder(newBoxFields[fieldBoxIndex].id, newBoxFields[fieldBoxIndex].order);
    updateFieldOrder(newBoxFields[fieldBoxIndex + 1].id, newBoxFields[fieldBoxIndex + 1].order);
    
    // Update state
    const newFields = fields.filter((f) => f.box_id !== field.box_id).concat(newBoxFields);
    setFields(newFields);
  };

  const handleSave = () => {
    // Save the current state to localStorage
    const config = {
      boxes,
      fields,
      export_format: exportFormat,
      // Include section lock settings
      section_locks: boxes.map(box => ({
        section_id: box.id,
        lock_when_signed: box.lockWhenSigned !== false
      }))
    };
    
    saveDocumentTypeConfig({
      ...config,
      title: "Form Builder Configuration",
      updated_at: new Date().toISOString(),
    });
  };

  const handleExportFormatChange = (format: string) => {
    setExportFormat(format);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Construtor de Formulário</h1>
          <Card className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-medium">Configurações</h2>
              <ExportFormatSelector 
                value={exportFormat}
                onChange={handleExportFormatChange}
              />
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setIsAddBoxDialogOpen(true)}
          >
            Adicionar Seção
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
          >
            Salvar Configuração
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <BoxList
            boxes={boxes}
            fields={fields}
            onDeleteBox={handleDeleteBox}
            onEditBox={handleEditBox}
            onAddField={handleAddField}
            onEditField={handleEditField}
            onDeleteField={handleDeleteField}
            onMoveFieldUp={handleMoveFieldUp}
            onMoveFieldDown={handleMoveFieldDown}
          />
        </ScrollArea>

        <AddBoxDialog
          open={isAddBoxDialogOpen}
          onClose={() => setIsAddBoxDialogOpen(false)}
          onAddBox={handleAddBox}
        />
      </div>
    </div>
  );
};

export default FormBuilder;
