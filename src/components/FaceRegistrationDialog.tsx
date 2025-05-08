
import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, RotateCcw, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerFace } from "@/utils/faceRecognition";

interface FaceRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  onRegister: (success: boolean) => void;
}

const FaceRegistrationDialog: React.FC<FaceRegistrationDialogProps> = ({
  open,
  onClose,
  onRegister
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceGuideRef = useRef<HTMLDivElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [registrationName, setRegistrationName] = useState("");
  const [registrationRole, setRegistrationRole] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "success" | "failed">("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Inicializar a câmera quando o componente carregar
  useEffect(() => {
    if (open && !cameraActive) {
      startCamera();
    }
    
    return () => {
      // Limpar recursos da câmera ao desmontar
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open]);
  
  const startCamera = async () => {
    try {
      setCaptureStatus("idle");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);
        
        toast({
          title: "Câmera ativada",
          description: "Posicione seu rosto para captura",
        });
      }
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
      setCaptureStatus("failed");
      
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive"
      });
    }
  };
  
  const switchCamera = () => {
    if (stream) {
      // Parar o stream atual
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    
    // Alternar modo
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    // Reiniciar câmera com novas configurações
    setTimeout(() => {
      startCamera();
    }, 300);
  };
  
  const captureFace = () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) {
      toast({
        title: "Erro na captura",
        description: "A câmera não está ativa. Tente reiniciar.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Definir dimensões do canvas para corresponder ao vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Desenhar quadro do vídeo no canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Se houver um guia de face, usar suas dimensões para captura padronizada
        if (faceGuideRef.current) {
          const guideRect = faceGuideRef.current.getBoundingClientRect();
          const videoRect = video.getBoundingClientRect();
          
          // Calcular coordenadas relativas ao vídeo
          const scaleX = video.videoWidth / videoRect.width;
          const scaleY = video.videoHeight / videoRect.height;
          
          const startX = (guideRect.left - videoRect.left) * scaleX;
          const startY = (guideRect.top - videoRect.top) * scaleY;
          const width = guideRect.width * scaleX;
          const height = guideRect.height * scaleY;
          
          // Criar um canvas temporário para a face recortada com tamanho padronizado
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 300; // Largura padronizada
          tempCanvas.height = 300; // Altura padronizada
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            // Desenhar apenas a região da face no canvas temporário
            tempCtx.drawImage(
              video, 
              startX, startY, width, height, // área de origem
              0, 0, 300, 300 // área de destino (padronizada)
            );
            
            // Usar a imagem padronizada
            const imageData = tempCanvas.toDataURL('image/png');
            setCapturedImage(imageData);
            setCaptureStatus("success");
          }
        } else {
          // Captura normal se não houver guia
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/png');
          setCapturedImage(imageData);
          setCaptureStatus("success");
        }
        
        toast({
          title: "Face capturada",
          description: "Agora complete seu cadastro com nome e cargo."
        });
      }
    } catch (error) {
      console.error("Erro ao capturar imagem:", error);
      setCaptureStatus("failed");
      
      toast({
        title: "Erro na captura",
        description: "Ocorreu um erro ao capturar a imagem.",
        variant: "destructive"
      });
    }
  };
  
  const resetCapture = () => {
    setCapturedImage(null);
    setCaptureStatus("idle");
    
    if (!cameraActive) {
      startCamera();
    }
  };
  
  const handleRegister = async () => {
    if (!capturedImage) {
      toast({
        title: "Imagem necessária",
        description: "Capture uma imagem facial antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    
    if (!registrationName || !registrationRole) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e cargo para registrar.",
        variant: "destructive"
      });
      return;
    }
    
    setCaptureStatus("capturing");
    
    try {
      const result = await registerFace({
        image: capturedImage,
        name: registrationName,
        role: registrationRole,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        toast({
          title: "Cadastro concluído",
          description: "Sua face foi registrada com sucesso."
        });
        
        // Parar câmera
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setCameraActive(false);
        }
        
        // Notificar componente pai
        onRegister(true);
        onClose();
      } else {
        toast({
          title: "Erro no cadastro",
          description: "Não foi possível completar o cadastro. Tente novamente.",
          variant: "destructive"
        });
        setCaptureStatus("failed");
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setCaptureStatus("failed");
      
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Calcular se o botão deve ser habilitado
  const isRegisterButtonEnabled = capturedImage !== null && 
                                 registrationName.trim() !== "" && 
                                 registrationRole.trim() !== "" &&
                                 captureStatus !== "capturing";
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastro de Face</DialogTitle>
          <DialogDescription>
            Registre seu rosto com nome e cargo para reconhecimento futuro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="w-full flex justify-center">
            {!capturedImage ? (
              <div className="relative w-64 h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                {cameraActive ? (
                  <>
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay 
                      playsInline
                      muted
                    />
                    {/* Guia de posicionamento do rosto */}
                    <div 
                      ref={faceGuideRef}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-dashed border-blue-400 rounded-full opacity-70"
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-500 font-medium text-center">
                        Posicione seu rosto aqui
                      </div>
                    </div>
                    <Button 
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-2 right-2 rounded-full"
                      onClick={switchCamera}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="h-20 w-20 text-gray-300" />
                  </div>
                )}
                
                {/* Canvas oculto para captura */}
                <canvas 
                  ref={canvasRef} 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="relative w-64 h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                <img 
                  src={capturedImage} 
                  alt="Face capturada" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-2 right-2">
                  <Button 
                    size="icon"
                    variant="outline"
                    className="rounded-full bg-white bg-opacity-50"
                    onClick={resetCapture}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-2 bg-green-500 bg-opacity-70">
                  <CheckCircle className="h-5 w-5 text-white mr-2" />
                  <span className="text-white font-medium">Imagem Capturada</span>
                </div>
              </div>
            )}
          </div>
          
          {!capturedImage && cameraActive && (
            <div className="flex justify-center">
              <Button onClick={captureFace}>
                <Camera className="h-4 w-4 mr-2" />
                Capturar Imagem
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="registration-name">Nome Completo</Label>
            <Input
              id="registration-name"
              value={registrationName}
              onChange={(e) => setRegistrationName(e.target.value)}
              placeholder="Ex: João da Silva"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="registration-role">Cargo/Função</Label>
            <Input
              id="registration-role"
              value={registrationRole}
              onChange={(e) => setRegistrationRole(e.target.value)}
              placeholder="Ex: Técnico de Segurança"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              onClose();
            }}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleRegister}
            disabled={!isRegisterButtonEnabled}
          >
            {captureStatus === "capturing" ? "Processando..." : "Registrar Face"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistrationDialog;
