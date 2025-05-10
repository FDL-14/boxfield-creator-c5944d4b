
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  // Call the init-master-user function when the app starts
  useEffect(() => {
    const initMasterUser = async () => {
      try {
        const response = await fetch(
          "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/init-master-user",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabase.auth.session()?.access_token || ''}`,
            }
          }
        );
        
        const data = await response.json();
        console.log("Master user initialization response:", data);
      } catch (error) {
        console.error("Error initializing master user:", error);
      }
    };
    
    initMasterUser();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
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
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
