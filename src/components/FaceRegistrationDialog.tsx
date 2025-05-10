import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User, Check, Loader2, X, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveFaceRegistration, FaceRegistration } from "@/utils/faceRecognition";
import SignatureBase64Dialog from "./SignatureBase64Dialog";

interface FaceRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void; // Making this prop optional to fix the error
  onRegister?: (success: boolean) => void; // Making this prop optional as well
}

export default function FaceRegistrationDialog({
  open,
  onOpenChange,
  onClose,
  onRegister
}: FaceRegistrationDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [showBase64Dialog, setShowBase64Dialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Verifica se os campos obrigatórios estão preenchidos
  const areRequiredFieldsFilled = name.trim() !== "" && role.trim() !== "";

  // Cleanup function for camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Clean up on unmount or dialog close
    return () => {
      stopCamera();
    };
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setName("");
      setRole("");
      setCameraError(null);
    }
  }, [open]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError(`Erro ao acessar câmera: ${err.message || 'Permissão negada'}`);
      toast({
        variant: "destructive",
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões."
      });
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    
    setCapturing(true);
    
    // Set canvas dimensions to match video
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image as base64
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
    }
    
    setCapturing(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const registerFace = async () => {
    if (!capturedImage || !name.trim() || !role.trim()) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor preencha todos os campos e capture uma imagem."
      });
      return;
    }
    
    setRegistering(true);
    
    try {
      // Create face registration object
      const registration: FaceRegistration = {
        name: name.trim(),
        role: role.trim(),
        cpf: "", // Pode ser preenchido se necessário
        image: capturedImage,
        timestamp: new Date().toISOString()
      };
      
      // Save registration
      const success = await saveFaceRegistration(registration);
      
      if (success) {
        toast({
          title: "Face registrada",
          description: "Sua face foi registrada com sucesso e pode ser usada para assinar documentos."
        });
        
        // Call onRegister callback if provided
        if (onRegister) {
          onRegister(true);
        }
        
        // Close dialog after successful registration
        if (onClose) {
          onClose();
        } else {
          onOpenChange(false);
        }
      } else {
        throw new Error("Falha ao salvar o registro");
      }
    } catch (error) {
      console.error("Error registering face:", error);
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: "Não foi possível registrar sua face. Por favor, tente novamente."
      });
      // Call onRegister callback if provided with false
      if (onRegister) {
        onRegister(false);
      }
    } finally {
      setRegistering(false);
    }
  };
  
  const handleShowBase64 = () => {
    if (capturedImage) {
      setShowBase64Dialog(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registro Facial</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Cargo/Função</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Digite seu cargo ou função"
              required
            />
          </div>
          
          <div className="flex flex-col items-center justify-center border rounded-md p-2 bg-muted/20">
            {!cameraActive && !capturedImage ? (
              <div className="flex flex-col items-center justify-center p-4">
                {cameraError ? (
                  <div className="text-center space-y-2">
                    <CameraOff className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-destructive">{cameraError}</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <User className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Preencha os campos acima e ative a câmera para capturar sua foto
                    </p>
                  </div>
                )}
              </div>
            ) : capturedImage ? (
              <div className="w-full">
                <img 
                  src={capturedImage} 
                  alt="Captura facial" 
                  className="w-full max-h-48 object-contain" 
                />
              </div>
            ) : (
              <div className="w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-48 object-contain"
                />
              </div>
            )}
            
            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <div className="flex flex-1 gap-2">
            {!cameraActive && !capturedImage && (
              <Button 
                type="button" 
                variant="outline"
                onClick={startCamera}
                disabled={!areRequiredFieldsFilled}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Ativar Câmera
              </Button>
            )}
            
            {cameraActive && !capturedImage && (
              <Button 
                type="button" 
                variant="outline"
                onClick={captureImage}
                disabled={capturing}
                className="flex-1"
              >
                {capturing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Capturar Foto
              </Button>
            )}
            
            {capturedImage && (
              <>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Nova Foto
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleShowBase64}
                  className="flex-1"
                >
                  Mostrar Base64
                </Button>
              </>
            )}
          </div>
          
          {capturedImage && (
            <Button 
              type="button"
              onClick={registerFace}
              disabled={registering || !name.trim() || !role.trim()}
              className="flex-1"
            >
              {registering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Registrar Face
            </Button>
          )}
        </DialogFooter>
        
        {/* Base64 Dialog */}
        <SignatureBase64Dialog
          open={showBase64Dialog}
          onClose={() => setShowBase64Dialog(false)}
          base64Data={capturedImage || ''}
          signatureName={`Face de ${name}`}
        />
      </DialogContent>
    </Dialog>
  );
}
