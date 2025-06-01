
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
  Users,
  User,
  Building,
  Briefcase,
  FolderTree,
  LayoutGrid,
  Settings,
  Plus,
  List,
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
            Construtor de Formulários
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[500px] gap-3 p-4 md:w-[600px] md:grid-cols-2 lg:w-[700px]">
              <li className="row-span-4">
                <Link
                  to="/form-builder"
                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                >
                  <FileEdit className="h-6 w-6 text-primary" />
                  <div className="mb-2 mt-4 text-lg font-medium">
                    Construtor de Formulários
                  </div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Crie e gerencie campos personalizados para seus formulários
                  </p>
                </Link>
              </li>
              
              <li>
                <Link
                  to="/form-types"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Gerenciar Tipos de Formulários
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Configure e gerencie os tipos de formulários
                  </p>
                </Link>
              </li>

              <li>
                <Link
                  to="/form-templates"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Modelos de Formulários
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Visualize e gerencie modelos de formulários criados
                  </p>
                </Link>
              </li>

              <li>
                <Link
                  to="/form-creator"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Formulário
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Crie um novo formulário a partir de modelos
                  </p>
                </Link>
              </li>
              
              {/* Specific Form Types */}
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
                    Formulários para análise de riscos em atividades
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
                    Formulários de permissão para atividades específicas
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
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Administration/Management Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Administração
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] md:grid-cols-2">
              <li>
                <Link
                  to="/users"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Adicione e gerencie os usuários do sistema
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  to="/groups"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Grupos/Clientes
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Adicione e gerencie grupos e clientes
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  to="/companies"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    Gerenciar Empresas
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Adicione e gerencie empresas
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  to="/sectors"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <FolderTree className="mr-2 h-4 w-4" />
                    Gerenciar Setores/Departamentos
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Adicione e gerencie setores e departamentos
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  to="/positions"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Gerenciar Cargos/Funções
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Adicione e gerencie cargos e funções
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  to="/persons"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Gerenciar Pessoas/Funcionários
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Adicione e gerencie pessoas e funcionários
                  </p>
                </Link>
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
