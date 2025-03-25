
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileEdit, ClipboardList, LineChart, PlusCircle } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Construtor de Formulário",
      description: "Crie e gerencie campos personalizados para seus formulários",
      icon: <FileEdit className="h-12 w-12 text-blue-600" />,
      path: "/form-builder",
      color: "bg-blue-50 hover:bg-blue-100"
    },
    {
      title: "Análise de Risco",
      description: "Documentos para análise de riscos em atividades",
      icon: <ClipboardList className="h-12 w-12 text-orange-600" />,
      path: "/analise-risco",
      color: "bg-orange-50 hover:bg-orange-100"
    },
    {
      title: "Permissão de Trabalho",
      description: "Documentos de permissão para atividades específicas",
      icon: <FileText className="h-12 w-12 text-green-600" />,
      path: "/permissao-trabalho",
      color: "bg-green-50 hover:bg-green-100"
    },
    {
      title: "Relatórios",
      description: "Visualize e analise dados de documentos criados",
      icon: <LineChart className="h-12 w-12 text-purple-600" />,
      path: "/relatorios/analise-risco",
      color: "bg-purple-50 hover:bg-purple-100"
    },
    {
      title: "Tipos de Documento",
      description: "Crie e gerencie tipos de documento personalizados",
      icon: <PlusCircle className="h-12 w-12 text-indigo-600" />,
      path: "/document-types",
      color: "bg-indigo-50 hover:bg-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center animate-slide-down">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema de Gestão de Documentos</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Crie, personalize e gerencie formulários e documentos para sua empresa. 
            Escolha uma das opções abaixo para começar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {menuItems.map((item, index) => (
            <Card 
              key={index} 
              className={`shadow-md hover:shadow-lg transition-all duration-300 ${item.color}`}
            >
              <CardHeader className="pb-4">
                <div className="mb-2">{item.icon}</div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={() => navigate(item.path)} 
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-200"
                >
                  Acessar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
