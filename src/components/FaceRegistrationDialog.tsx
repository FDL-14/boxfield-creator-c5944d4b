
import { useState, useEffect, useRef } from "react";
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
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("");
      setCpf("");
      setRole("");
      setCapturedImage(null);
      setIsCapturing(false);
      setCameraActive(false);
      
      // Stop camera if it's active when dialog closes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [open, stream]);
  
  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
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
  
  // Start camera capture
  const startCamera = async () => {
    if (!name || !cpf || !role) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, CPF e cargo para prosseguir",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCapturing(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
      }
      
      setIsCapturing(false);
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCapturing(false);
      
      toast({
        title: "Erro ao acessar câmera",
        description: "Verifique se a câmera está disponível e se as permissões foram concedidas.",
        variant: "destructive"
      });
    }
  };
  
  // Capture face from video
  const captureFace = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      toast({
        title: "Câmera não ativa",
        description: "Ative a câmera para capturar a face",
        variant: "destructive"
      });
      return;
    }
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data as base64
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
        
        // Stop camera stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        setCameraActive(false);
        
        toast({
          title: "Imagem capturada",
          description: "Rosto capturado com sucesso",
          variant: "default"
        });
      }
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
  
  // Check if all required fields are filled to enable the "Register" button
  const areRequiredFieldsFilled = name.trim() !== "" && cpf.trim() !== "" && role.trim() !== "";
  
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
              ) : cameraActive ? (
                <div className="w-64 h-64 border rounded-md overflow-hidden relative">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Circular overlay for face positioning */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 rounded-full border-2 border-blue-400 border-dashed opacity-70"></div>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 border rounded-md flex items-center justify-center bg-slate-50">
                  <User className="h-16 w-16 text-slate-300" />
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                {!cameraActive && !capturedImage && (
                  <Button 
                    variant="secondary"
                    disabled={isCapturing || !areRequiredFieldsFilled}
                    onClick={startCamera}
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando câmera...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Ativar Câmera
                      </>
                    )}
                  </Button>
                )}
                
                {cameraActive && (
                  <Button 
                    variant="secondary" 
                    onClick={captureFace}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Capturando...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar Face
                      </>
                    )}
                  </Button>
                )}
                
                {capturedImage && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Nova Captura
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            onOpenChange(false);
            if (onClose) onClose();
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !capturedImage || !areRequiredFieldsFilled}
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
      
      {/* Hidden canvas for capturing the image */}
      <canvas ref={canvasRef} className="hidden" />
    </Dialog>
  );
}
