
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from "lucide-react";

interface EmptyStateProps {
  onAddBox: () => void;
  isLoading?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddBox, isLoading = false }) => {
  return (
    <Card className="flex flex-col items-center justify-center p-10 text-center">
      <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Nenhuma seção criada</h3>
      <p className="text-muted-foreground mb-6">
        Crie seções para organizar os campos do seu formulário.
      </p>
      <Button onClick={onAddBox} disabled={isLoading}>
        <PlusCircle className="h-5 w-5 mr-2" />
        Adicionar Primeira Seção
      </Button>
    </Card>
  );
};

export default EmptyState;
