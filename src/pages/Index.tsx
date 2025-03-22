
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 animate-fade-in">
      <div className="w-full max-w-3xl p-8 glass-card rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 animate-slide-down">
          Construtor de Formulário
        </h1>
        <p className="text-lg text-gray-700 mb-8 animate-slide-up">
          Uma interface intuitiva para criar e gerenciar formulários personalizados com design minimalista e elegante.
        </p>
        <Button 
          onClick={() => navigate("/form-builder")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-lg text-lg font-medium transition-all duration-300 animate-fade-in"
        >
          Começar a Construir
        </Button>
      </div>
    </div>
  );
};

export default Index;
