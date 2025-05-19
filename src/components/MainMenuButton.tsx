
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MainMenuButtonProps {
  className?: string;
}

const MainMenuButton: React.FC<MainMenuButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/');
  };

  return (
    <Button 
      onClick={handleClick} 
      variant="outline"
      size="sm"
      className={`flex items-center gap-1 ${className}`}
    >
      <Home className="h-4 w-4" />
      Menu Principal
    </Button>
  );
};

export default MainMenuButton;
