
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
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
