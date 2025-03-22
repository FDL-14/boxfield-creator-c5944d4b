
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 animate-fade-in">
      <div className="w-full max-w-3xl p-8 glass-card rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-700 animate-slide-down">
          Formulários de Segurança
        </h1>
        <p className="text-lg text-gray-700 mb-8 animate-slide-up">
          Crie e gerencie formulários de Análise de Risco e Permissão para Trabalho
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate("/form-builder")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-lg text-lg font-medium transition-all duration-300 animate-fade-in"
          >
            Construtor de Formulários
          </Button>
          <Button 
            onClick={() => navigate("/analise-risco")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-lg text-lg font-medium transition-all duration-300 animate-fade-in"
          >
            Análise de Risco
          </Button>
          <Button 
            onClick={() => navigate("/permissao-trabalho")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-lg text-lg font-medium transition-all duration-300 animate-fade-in col-span-1 md:col-span-2"
          >
            Permissão para Trabalho
          </Button>
        </div>
      </div>
      <div className="mt-10">
        <img 
          src="/lovable-uploads/b383b9e2-8185-41a7-9b33-bedebd3830a0.png"
          alt="Logo Atvos"
          className="h-12 object-contain"
        />
      </div>
    </div>
  );
};

export default Index;
