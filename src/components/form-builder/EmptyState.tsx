
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface EmptyStateProps {
  onAddBox: () => void;
  isLoading: boolean;
}

export default function EmptyState({ onAddBox, isLoading }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed animate-fade-in transition-all duration-300">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhuma seção criada
      </h3>
      <p className="text-gray-500 mb-4">
        Comece criando uma nova seção para seu formulário
      </p>
      <Button
        onClick={onAddBox}
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
  );
}
