
import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Save } from "lucide-react";
import SaveAsTemplateDialog from "./SaveAsTemplateDialog";

interface SaveAsDocumentButtonProps extends ButtonProps {
  docType: string;
  documentData: any;
  onSaved?: (savedDoc: any) => void;
  label?: string;
}

const SaveAsDocumentButton: React.FC<SaveAsDocumentButtonProps> = ({
  docType,
  documentData,
  onSaved,
  label = "Salvar Como",
  ...props
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const handleOpenSaveDialog = () => {
    setShowSaveDialog(true);
  };
  
  const handleCloseSaveDialog = () => {
    setShowSaveDialog(false);
  };
  
  const handleSaved = (savedDoc: any) => {
    if (onSaved) {
      onSaved(savedDoc);
    }
  };
  
  return (
    <>
      <Button
        onClick={handleOpenSaveDialog}
        {...props}
      >
        <Save className="h-4 w-4 mr-2" />
        {label}
      </Button>
      
      <SaveAsTemplateDialog
        open={showSaveDialog}
        onClose={handleCloseSaveDialog}
        onSave={handleSaved}
        docType={docType}
        initialData={documentData}
      />
    </>
  );
};

export default SaveAsDocumentButton;
