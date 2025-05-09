
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Camera, User, Loader2, Check } from "lucide-react";

export interface FaceRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onRegister?: (success: boolean) => void;
}

export default function FaceRegistrationDialog({ open, onOpenChange, onClose, onRegister }: FaceRegistrationDialogProps) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("");
      setCpf("");
      setRole("");
      setCapturedImage(null);
      setIsCapturing(false);
    }
  }, [open]);
  
  // Format CPF with mask (XXX.XXX.XXX-XX)
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").substring(0, 11);
    
    if (numbers.length <= 3) {
      return numbers;
    }
    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    }
    if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    }
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Handle CPF input with formatting
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };
  
  // Start face capture
  const startCapture = async () => {
    if (!name || !cpf || !role) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, CPF e cargo para prosseguir",
        variant: "destructive"
      });
      return;
    }
    
    setIsCapturing(true);
    
    try {
      // In a real app, this would integrate with a camera API
      // For this demo, we'll simulate with a mock image
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockFaceImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzExQkVGNkZBNDIxMTFFQUIzRjhGRjQ0MkJDRDhGMUMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzExQkVGNzBBNDIxMTFFQUIzRjhGRjQ0MkJDRDhGMUMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3MTFCRUY2REE0MjExMUVBQjNGOEZGNDQyQkNEOEYxQyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3MTFCRUY2RUE0MjExMUVBQjNGOEZGNDQyQkNEOEYxQyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pm9RTFQAAAWsSURBVHja7J17bBRFHMfbgkJfaUttJcofgF0oCm2hgPJqoAQjPtAYeURjYsSYJirxwROMD6KIUSEak9oYE0TUeoC2iRqVItVqIAUqj0IVrKUvCrTF0lYLLXe7bdavctfs9e5272537m5/M8knd3Oz97vffuZ2dnd3Z+fQoUMKhGf+Jk52W0UHRfJfEgUEBAgCBAECAoQAAQFCgIAAIUBAgBAgIEAIEAIEBAgBAgKEACFAQIAQIA4vGRkZ/XqwHYfDQYCAAMkkkZGRlnwoNzf3H4UPCu1j2YbAgCgkGRkZ7Xa5XHGkeAiQtDBk1NbWPkdt0PnGY9mGeEZpaen9dXV16w3KuLq6+r6ioqLFvByCZOiVs0VP0cxhoYaJEFmmOcdt27bN5+asYv4itCPRwBiTOhQoKAiltfC0bXSmXNHJiOJ+WlBQ0JWUlJTe1tbWkZ+ff0Vv7SsrK2eUlJRs4LLeaas3SVXf3ythz8ihqqpqGWkJBXIsRaifNn7lFi1atGjPnj0ve9j7hCtVVVVz+Uc710PBAGOKFAlIS0vLaoMgEkhLS0traGhYPm3atN0c5CZ9O/f9WgzUjVOw53VJyQsuW2jCg4VW5tnOaXWquxmvVg0uRXnU03zV+36/fv36eR56blnJyckpV3kfh9tI6hPGb926dXVjY+MbQRgj5ZSXl7+6c+fOV43aiPPz85QOYsKECRdSUlLeMakCyfl2Ae5ra2vjk5OTf1W9AwtVH5CpU6duLC0tLWIVNWRcBUhNTU0Z2S1v0iec6enpX8+ePbvlasP8YD+PbYDY7fZfeUJnJstYDZs8efLpCRMm/D58+PBQIcRhg+1mgYnbuXNnekNDw4qwsDAnteLo6OjzzP+gZQCRJxoXF3eSK4MLCwt3CB4hVnl7MMFoIFeFU7nRTxTWOhNko2Hw4MHvs5ZVVlbme2ZJb29vhNbVbDZbB9dgrNKLzh6VQp+lG5ZP511NqkGXrXOf2bNn5+/bt2+H0dy+pUuXZrFn084lOrVsoVxIGxuVdJYGbK4sztXU/fGEQVscUW8wSO3i1NxknPam1NpJdXV11Y0bNz47cuTIE1FRUac3b97spX7XX3Y5IH0qpr1i3N1uFI8o3m9PNQ5wV0P7qn5/uB6sLMpm+q/JyclfqL4nXxCofom+h8KVOVFJ/Gn9y6nw2h07dqy4cuXKofT09PcsqNI5GElJSWVah9+sz010Z+pDWSCRQXy+A6WHv47HECdrKz9j9VY1RX9A1FvHbdu2zW9pbX2mra1tKpd/1W1hiT8wJk6cWMTt27pftEAGIriiXsxwMG149VmSQUFDZxivQXeJDSNJVcBaTrVbzDgEw7C7hZuyoyX1dcbk3JZtDp1vPNYB6e7ujmRvMyfZ1Z6/R5Wav/nTWFMt1LxmVCfNnDnzZZPK23Gmmwz8BDKOpwvHsZT9RDD8rtHmbsQMBu1Sr1UnzeseiIxE0RsqnbOZoDFjxnzrcrluNqvScrncQASLrmEzGOK+u7t7NKvhn2EQDBFji92sJjqz06u0RL9AuDz28kigRnBGB5AWj8ALJKBtCKpr6y0xCNC2I1hA8BIaAgQECAECAoQAAQFCgKDKsh4JaEMGDQ2LxMwMGNC2I7iGkGL5C4RgBAEIQTAGQkAQXiAYbgIBAQIChAABAQICBAQIAQICBAQIAQICBAQIAQICBAQIAQICBAQICBACBAQIAQICxEKBP6/pdivnlc+wyQmEAEGVBQIEBAgBAgIEBAgBAgIEBAgBAgIEBAgBgvCoQFZZ3mq9PxP+XkJ3mBkXG28Jy8uWO+OqqlreVXJls9nwd8yAAEGdgoEhCBAQICBAQICAADFV4P/TjZ0jf0UEVRYIEBAgBAgIEBAgBAgIEBAgBAgIEBAgBAgIEBAgBAgIEBAgBAgIEBAgeqJWJQNGUTmLLBMSEhRpCqosUL0FQmTIEDlksXT+F2AAT4+n68isGnYAAAAASUVORK5CYII=";
      
      setCapturedImage(mockFaceImage);
      
      toast({
        title: "Imagem capturada",
        description: "Rosto capturado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Error during face capture:", error);
      toast({
        title: "Erro na captura",
        description: "Não foi possível capturar a imagem do rosto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };
  
  // Save face registration
  const handleSave = async () => {
    if (!name || !cpf || !role || !capturedImage) {
      toast({
        title: "Informações incompletas",
        description: "Preencha todos os campos e capture sua face",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulating saving to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in local storage for now
      const registration = {
        name,
        cpf,
        role,
        image: capturedImage,
        timestamp: new Date().toISOString()
      };
      
      const stored = localStorage.getItem('registeredFaces');
      const faces = stored ? JSON.parse(stored) : [];
      faces.push(registration);
      localStorage.setItem('registeredFaces', JSON.stringify(faces));
      
      toast({
        title: "Registro concluído",
        description: "Face registrada com sucesso",
        variant: "default"
      });
      
      onOpenChange(false);
      if (onClose) onClose();
      if (onRegister) onRegister(true);
    } catch (error) {
      console.error("Error saving face registration:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o registro. Tente novamente.",
        variant: "destructive"
      });
      if (onRegister) onRegister(false);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registro Facial
          </DialogTitle>
          <DialogDescription>
            Registre seu rosto para uso em assinaturas digitais.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Cargo/Função</Label>
            <Input
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Cargo ou função"
            />
          </div>
          
          <div className="space-y-4">
            <Label>Captura de Face</Label>
            
            <div className="flex flex-col items-center justify-center">
              {capturedImage ? (
                <div className="w-48 h-48 border rounded-md overflow-hidden">
                  <img 
                    src={capturedImage} 
                    alt="Face capturada" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ) : (
                <div className="w-48 h-48 border rounded-md flex items-center justify-center bg-slate-50">
                  <User className="h-16 w-16 text-slate-300" />
                </div>
              )}
              
              <Button 
                className="mt-4"
                variant="secondary"
                disabled={isCapturing || !name || !cpf || !role}
                onClick={startCapture}
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Capturando...
                  </>
                ) : capturedImage ? (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Novamente
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Face
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            if (onClose) onClose();
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !capturedImage}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvar Registro
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
