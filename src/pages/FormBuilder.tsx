
import React, { useState, useEffect } from "react";
import { useFormService } from "@/services/formService";
import BoxList from "@/components/form-builder/BoxList";
import AddBoxDialog from "@/components/form-builder/AddBoxDialog";
import AddFieldDialog from "@/components/form-builder/AddFieldDialog";
import FormBuilderHeader from "@/components/form-builder/FormBuilderHeader";

export default function FormBuilder() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <FormBuilderHeader 
          onAddBox={() => setShowAddBox(true)}
          isLoading={isLoading}
        />

        <BoxList
          boxes={boxes}
          fields={fields}
          onAddField={handleAddFieldClick}
          onDeleteBox={handleDeleteBox}
          onDeleteField={handleDeleteField}
          onEditField={handleEditField}
          onAddBox={() => setShowAddBox(true)}
          isLoading={isLoading}
        />

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
