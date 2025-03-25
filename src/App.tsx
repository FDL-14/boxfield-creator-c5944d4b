
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FormBuilder from "./pages/FormBuilder";
import AnaliseRisco from "./pages/AnaliseRisco";
import PermissaoTrabalho from "./pages/PermissaoTrabalho";
import RelatoriosAnaliseRisco from "./pages/RelatoriosAnaliseRisco";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
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
