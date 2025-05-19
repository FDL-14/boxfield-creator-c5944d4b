
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <PermissionsProvider>
            <AppInitializer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/form-builder" element={<FormBuilder />} />
              <Route path="/analise-risco" element={<AnaliseRisco />} />
              <Route path="/permissao-trabalho" element={<PermissaoTrabalho />} />
              <Route path="/relatorios/analise-risco" element={<RelatoriosAnaliseRisco />} />
              <Route path="/document-types" element={<DocumentTypes />} />
              <Route path="/document-creator" element={<DocumentCreator />} />
              <Route path="/document-creator/:docType" element={<DocumentCreator />} />
              <Route path="/biometrics" element={<BiometricsManager />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/companies" element={<CompaniesManager />} />
              <Route path="/clients" element={<ClientsManager />} />
              <Route path="/users" element={<UsersManager />} />
              <Route path="/groups" element={<GroupsClientsManager />} />
              <Route path="/sectors" element={<SectorsDepartmentsManager />} />
              <Route path="/positions" element={<PositionsRolesManager />} />
              <Route path="/persons" element={<PersonsEmployeesManager />} />
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
