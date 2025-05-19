
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { useEffect } from "react";
import { ensureMasterUserInitialized } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import FormBuilder from "./pages/FormBuilder";
import AnaliseRisco from "./pages/AnaliseRisco";
import PermissaoTrabalho from "./pages/PermissaoTrabalho";
import RelatoriosAnaliseRisco from "./pages/RelatoriosAnaliseRisco";
import NotFound from "./pages/NotFound";
import DocumentCreator from "./pages/DocumentCreator";
import DocumentTypes from "./pages/DocumentTypes";
import BiometricsManager from "./pages/BiometricsManager";
import Auth from "./pages/Auth";
import CompaniesManager from "./pages/CompaniesManager";
import ClientsManager from "./pages/ClientsManager";
import UsersManager from "./pages/UsersManager";
import GroupsClientsManager from "./pages/GroupsClientsManager";
import SectorsDepartmentsManager from "./pages/SectorsDepartmentsManager";
import PositionsRolesManager from "./pages/PositionsRolesManager";
import PersonsEmployeesManager from "./pages/PersonsEmployeesManager";

const queryClient = new QueryClient();

// App initialization component
function AppInitializer() {
  useEffect(() => {
    // Initialize master user on app start
    ensureMasterUserInitialized().catch(error => {
      console.error("Failed to initialize master user:", error);
    });
  }, []);
  
  return null;
}

// Modified AuthGuard component to bypass authentication check
interface AuthGuardProps {
  element: React.ReactNode;
}

function AuthGuard({ element }: AuthGuardProps) {
  // Always return the protected content without checking authentication
  return <>{element}</>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <PermissionsProvider>
            <AppInitializer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/form-builder" element={<AuthGuard element={<FormBuilder />} />} />
              <Route path="/analise-risco" element={<AuthGuard element={<AnaliseRisco />} />} />
              <Route path="/permissao-trabalho" element={<AuthGuard element={<PermissaoTrabalho />} />} />
              <Route path="/permissao-trabalho/quente" element={<AuthGuard element={<PermissaoTrabalho />} />} />
              <Route path="/permissao-trabalho/frio" element={<AuthGuard element={<PermissaoTrabalho />} />} />
              <Route path="/relatorios/analise-risco" element={<AuthGuard element={<RelatoriosAnaliseRisco />} />} />
              <Route path="/document-types" element={<AuthGuard element={<DocumentTypes />} />} />
              <Route path="/document-creator" element={<AuthGuard element={<DocumentCreator />} />} />
              <Route path="/document-creator/:docType" element={<AuthGuard element={<DocumentCreator />} />} />
              <Route path="/biometrics" element={<AuthGuard element={<BiometricsManager />} />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/companies" element={<AuthGuard element={<CompaniesManager />} />} />
              <Route path="/clients" element={<AuthGuard element={<ClientsManager />} />} />
              <Route path="/users" element={<AuthGuard element={<UsersManager />} />} />
              <Route path="/groups" element={<AuthGuard element={<GroupsClientsManager />} />} />
              <Route path="/sectors" element={<AuthGuard element={<SectorsDepartmentsManager />} />} />
              <Route path="/positions" element={<AuthGuard element={<PositionsRolesManager />} />} />
              <Route path="/persons" element={<AuthGuard element={<PersonsEmployeesManager />} />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </PermissionsProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
