
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, showLogout = false }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
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

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleBackToHome} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Menu Principal
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {showLogout && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        )}
        <img
          src="/lovable-uploads/38edc1d3-2b5d-4e63-be2a-7ead983b2bb8.png"
          alt="Total Data Logo"
          className="h-10 object-contain"
        />
      </div>
    </div>
  );
};

export default Header;
