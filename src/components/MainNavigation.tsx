
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  FileText,
  FileEdit,
  ClipboardCheck,
  Flame,
  Snowflake,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MainNavigation: React.FC = () => {
  const { isAdmin, isMaster, isAuthenticated } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthRequiredClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar logado para acessar esta página",
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }
    return true;
  };

  return (
    <NavigationMenu className="max-w-full w-full justify-start mb-8">
      <NavigationMenuList className="space-x-2">
        {/* Item 1: Construtor de Formulário */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <FileEdit className="mr-2 h-4 w-4" />
            Construtor de Formulário
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    to="/form-builder"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    onClick={(e) => handleAuthRequiredClick(e, "/form-builder")}
                  >
                    <FileEdit className="h-6 w-6 text-primary" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      Construtor de Formulário
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Crie e gerencie campos personalizados para seus formulários
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/document-types"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => handleAuthRequiredClick(e, "/document-types")}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Tipos de Documentos
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Crie e gerencie tipos de documentos personalizados
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Item 2: Tipos de Documentos */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <FileText className="mr-2 h-4 w-4" />
            Tipos de Documentos
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/analise-risco"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => handleAuthRequiredClick(e, "/analise-risco")}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Análise de Risco
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Documentos para análise de riscos em atividades
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/permissao-trabalho"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => handleAuthRequiredClick(e, "/permissao-trabalho")}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Permissão de Trabalho
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Documentos de permissão para atividades específicas
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/permissao-trabalho/quente"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => handleAuthRequiredClick(e, "/permissao-trabalho/quente")}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <Flame className="mr-2 h-4 w-4 text-orange-500" />
                      Serviço a Quente
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Permissão para trabalhos com geração de calor ou faíscas
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/permissao-trabalho/frio"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => handleAuthRequiredClick(e, "/permissao-trabalho/frio")}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <Snowflake className="mr-2 h-4 w-4 text-blue-500" />
                      Serviço a Frio
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Permissão para trabalhos sem geração de calor ou faíscas
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/document-creator/test"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => handleAuthRequiredClick(e, "/document-creator/test")}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Teste de Salvar
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Teste de funcionalidade de salvar documentos
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Login/Logout */}
        <NavigationMenuItem className="ml-auto">
          {isAuthenticated ? (
            <Link 
              to="/" 
              className={cn(navigationMenuTriggerStyle())}
              onClick={async () => {
                await supabase.auth.signOut();
                toast({
                  title: "Logout realizado com sucesso",
                  description: "Você foi desconectado"
                });
                navigate("/");
              }}
            >
              Sair
            </Link>
          ) : (
            <Link to="/auth" className={cn(navigationMenuTriggerStyle())}>
              Entrar
            </Link>
          )}
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNavigation;
