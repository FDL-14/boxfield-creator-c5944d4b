import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PermissionsProvider } from "@/hooks/usePermissions";
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

const queryClient = new QueryClient();

const App = () => {
  // The structure remains the same, we'll just make sure the MainHeader component is used in each page
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <PermissionsProvider>
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
