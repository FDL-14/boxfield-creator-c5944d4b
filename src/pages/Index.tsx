
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileEdit, ClipboardList, LineChart, PlusCircle, Users, Building, UserCircle, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate('/auth');
        return;
      }
      
      setUser(data.session.user);
      
      // Get user profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
        
      if (profileData) {
        setUser({
          ...data.session.user,
          profile: profileData
        });
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erro ao desconectar",
        description: "Ocorreu um erro ao tentar fazer logout",
        variant: "destructive"
      });
    }
  };

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
    },
    {
      title: "Empresas",
      description: "Gerencie o cadastro de empresas",
      icon: <Building className="h-12 w-12 text-sky-600" />,
      path: "/companies",
      color: "bg-sky-50 hover:bg-sky-100"
    },
    {
      title: "Clientes",
      description: "Gerencie o cadastro de clientes",
      icon: <Users className="h-12 w-12 text-amber-600" />,
      path: "/clients",
      color: "bg-amber-50 hover:bg-amber-100"
    },
    {
      title: "Usuários",
      description: "Gerencie usuários e permissões",
      icon: <UserCircle className="h-12 w-12 text-pink-600" />,
      path: "/users",
      color: "bg-pink-50 hover:bg-pink-100"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 bg-white shadow-sm">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src="/lovable-uploads/38edc1d3-2b5d-4e63-be2a-7ead983b2bb8.png"
              alt="Total Data Logo"
              className="h-10 object-contain"
            />
            <h1 className="text-xl font-bold">Sistema em Formulário Inteligente</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/document-types">Tipos de Documento</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/form-builder">Construtor de Formulários</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/biometrics">Gerenciar Biometria</Link>
              </Button>
            </nav>
            
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-right">
                  <p className="font-medium">{user.profile?.name || user.email}</p>
                  <p className="text-gray-500 text-xs">{user.profile?.is_admin ? 'Administrador' : 'Usuário'}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto flex-1 p-4">
        <div className="mb-8 text-center animate-slide-down">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema em Formulário Inteligente</h1>
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
