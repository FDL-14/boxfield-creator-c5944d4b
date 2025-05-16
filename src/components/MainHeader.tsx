
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

interface MainHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

const MainHeader: React.FC<MainHeaderProps> = ({ title, subtitle, rightContent }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
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
      {rightContent && (
        <div className="flex items-center gap-4">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default MainHeader;
