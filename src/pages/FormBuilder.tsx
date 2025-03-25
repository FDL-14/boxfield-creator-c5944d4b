
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormService } from "@/services/formService";
import BoxList from "@/components/form-builder/BoxList";
import AddBoxDialog from "@/components/form-builder/AddBoxDialog";
import AddFieldDialog from "@/components/form-builder/AddFieldDialog";
import FormBuilderHeader from "@/components/form-builder/FormBuilderHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

export default function FormBuilder() {
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState([]);
  const [fields, setFields] = useState([]);
  const [showAddBox, setShowAddBox] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const formService = useFormService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { boxesData, fieldsData } = await formService.loadData();
      setBoxes(boxesData);
      setFields(fieldsData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBox = async (boxData) => {
    try {
      setIsLoading(true);
      const success = await formService.addBox(boxData);
      if (success) {
        await loadData();
        setShowAddBox(false);
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
      }
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

        <BoxList
          boxes={boxes}
          fields={fields}
          onAddField={handleAddFieldClick}
          onDeleteBox={handleDeleteBox}
          onDeleteField={handleDeleteField}
          onEditField={handleEditField}
          onAddBox={() => setShowAddBox(true)}
          onMoveBox={handleMoveBox}
          onMoveField={handleMoveField}
          isLoading={isLoading}
        />

        <div className="mt-6 flex justify-end">
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
      </div>
    </div>
  );
}
