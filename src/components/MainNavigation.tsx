
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
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

const MainNavigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <NavigationMenu className="max-w-full w-full justify-start mb-8">
      <NavigationMenuList className="space-x-2">
        {/* Form Builder - First Level */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <FileEdit className="mr-2 h-4 w-4" />
            Construtor de Formulário
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <Link
                  to="/form-builder"
                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                >
                  <FileEdit className="h-6 w-6 text-primary" />
                  <div className="mb-2 mt-4 text-lg font-medium">
                    Construtor de Formulário
                  </div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Crie e gerencie campos personalizados para seus formulários
                  </p>
                </Link>
              </li>
              
              {/* Document Types - Second Level */}
              <li className="col-span-1">
                <div>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Tipos de Documentos
                    </NavigationMenuTrigger>
                    
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        {/* Third Level Items */}
                        <li>
                          <Link
                            to="/analise-risco"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none flex items-center">
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Análise de Risco
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Documentos para análise de riscos em atividades
                            </p>
                          </Link>
                        </li>
                        
                        <li>
                          <Link
                            to="/permissao-trabalho"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none flex items-center">
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Permissão de Trabalho
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Documentos de permissão para atividades específicas
                            </p>
                          </Link>
                        </li>
                        
                        <li>
                          <Link
                            to="/permissao-trabalho/quente"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none flex items-center">
                              <Flame className="mr-2 h-4 w-4 text-orange-500" />
                              Serviço a Quente
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Permissão para trabalhos com geração de calor ou faíscas
                            </p>
                          </Link>
                        </li>
                        
                        <li>
                          <Link
                            to="/permissao-trabalho/frio"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none flex items-center">
                              <Snowflake className="mr-2 h-4 w-4 text-blue-500" />
                              Serviço a Frio
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Permissão para trabalhos sem geração de calor ou faíscas
                            </p>
                          </Link>
                        </li>
                        
                        <li>
                          <Link
                            to="/document-creator/test"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none flex items-center">
                              <Save className="mr-2 h-4 w-4" />
                              Teste de Salvar
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Teste de funcionalidade de salvar documentos
                            </p>
                          </Link>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </div>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Login/Logout Link */}
        <NavigationMenuItem className="ml-auto">
          <Link to="/auth" className={cn(navigationMenuTriggerStyle())}>
            Entrar/Sair
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNavigation;
