
import { Link } from "react-router-dom";
import MainHeader from "@/components/MainHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Building2, BarChart3, ClipboardCheck, FileEdit, LayoutGrid, Briefcase, Building, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import MainNavigation from "@/components/MainNavigation";

const Index = () => {
  const { isAdmin, isMaster, isAuthenticated } = usePermissions();
  
  return (
    <div className="container mx-auto py-6">
      <MainHeader title="Menu Principal" />
      
      <MainNavigation />
      
      <div className="my-8 text-center">
        <h1 className="text-3xl font-bold">Formulário Inteligente</h1>
        <p className="text-muted-foreground mt-2">
          Crie, personalize e gerencie formulários e documentos para sua empresa. Escolha uma
          das opções abaixo para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-6 w-6 text-primary" />
              Construtor de Formulário
            </CardTitle>
            <CardDescription>
              Crie e gerencie campos personalizados para seus formulários
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Use o construtor para criar formulários complexos com campos personalizados, seções e validações.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" disabled={!isAuthenticated}>
              <Link to="/form-builder">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Análise de Risco
            </CardTitle>
            <CardDescription>
              Documentos para análise de riscos em atividades
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Preencha formulários de análise de risco para atividades de sua empresa.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" disabled={!isAuthenticated}>
              <Link to="/analise-risco">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Permissão de Trabalho
            </CardTitle>
            <CardDescription>
              Documentos de permissão para atividades específicas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Crie e gerencie permissões de trabalho para atividades que requerem autorização.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" disabled={!isAuthenticated}>
              <Link to="/permissao-trabalho">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Visualize e analise dados de documentos criados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Acesse relatórios e estatísticas sobre os documentos criados na plataforma.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" disabled={!isAuthenticated}>
              <Link to="/relatorios/analise-risco">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Tipos de Documento
            </CardTitle>
            <CardDescription>
              Crie e gerencie tipos de documentos personalizados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Configure diferentes tipos de documentos para usar no sistema.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" disabled={!isAuthenticated}>
              <Link to="/document-types">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Usuários
            </CardTitle>
            <CardDescription>
              Gerencie usuários e permissões
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Adicione novos usuários e configure suas permissões de acesso ao sistema.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" disabled={!isAdmin && !isMaster || !isAuthenticated}>
              <Link to="/users">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              Grupos/Clientes
            </CardTitle>
            <CardDescription>
              Gerencie grupos e clientes da organização
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie grupos ou clientes da sua organização.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/groups">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Empresas/Unidades
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie suas empresas ou unidades
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Adicione e configure empresas ou unidades organizacionais.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/companies">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Setores/Departamentos
            </CardTitle>
            <CardDescription>
              Gerencie setores e departamentos da organização
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie setores e departamentos dentro das unidades.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/sectors">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Cargos/Funções
            </CardTitle>
            <CardDescription>
              Gerencie cargos e funções da organização
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie cargos e funções para os setores.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/positions">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Pessoas/Empregados
            </CardTitle>
            <CardDescription>
              Gerencie pessoas e empregados da organização
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie pessoas e empregados com seus respectivos cargos.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/persons">Acessar</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
