
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface FormBuilderHeaderProps {
  onAddBox: () => void;
  isLoading: boolean;
}

export default function FormBuilderHeader({ onAddBox, isLoading }: FormBuilderHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div className="animate-slide-down">
        <h1 className="text-3xl font-bold text-gray-900">Construtor de Formulário</h1>
        <p className="text-gray-500 mt-1">
          Crie e gerencie campos e seções do seu formulário
        </p>
      </div>
      <Button 
        onClick={onAddBox}
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
  );
}
