import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Fingerprint, Camera, AlertCircle, CheckCircle, RotateCcw, Copy, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import FaceRegistrationDialog from "./FaceRegistrationDialog";
import { loadRegisteredFaces, verifyFace, compareFaces, FaceRegistration } from "@/utils/faceRecognition";

interface BiometricSignatureProps {
  onCapture: (type: "face" | "fingerprint", data: string, additionalData?: any) => void;
  onCancel: () => void;
}

// Define profile type to match the database
interface Profile {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  cpf?: string | null;
  company_ids?: string[] | null;
  client_ids?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  face_image?: string | null;
  is_face_registered?: boolean | null;
}

const BiometricSignature: React.FC<BiometricSignatureProps> = ({
  onCapture,
  onCancel,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"face" | "fingerprint">("face");
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "success" | "failed">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showBase64, setShowBase64] = useState(false);
  const [base64Data, setBase64Data] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [videoConstraints, setVideoConstraints] = useState({
    width: 640,
    height: 480,
    facingMode: "user" as "user" | "environment"
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasRegisteredFace, setHasRegisteredFace] = useState(false);
  const [registeredFaceImage, setRegisteredFaceImage] = useState<string | null>(null);
  const [showFaceRegisterDialog, setShowFaceRegisterDialog] = useState(false);
  const [registeredFaces, setRegisteredFaces] = useState<FaceRegistration[]>([]);
  const [recognizedFaceData, setRecognizedFaceData] = useState<FaceRegistration | null>(null);
  
  // Check for registered faces on component mount
  useEffect(() => {
    loadRegisteredFacesData();
  }, []);
  
  const loadRegisteredFacesData = async () => {
    try {
      const faces = await loadRegisteredFaces();
      setRegisteredFaces(faces);
      
      if (faces.length > 0) {
        setHasRegisteredFace(true);
        setRegisteredFaceImage(faces[0].image);
      }
    } catch (error) {
      console.error("Erro ao carregar faces registradas:", error);
    }
  };
  
  // Initialize camera when component mounts
  useEffect(() => {
    return () => {
      // Cleanup function to stop the camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  const switchCamera = () => {
    if (stream) {
      // Stop current stream
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    
    // Toggle facing mode
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    setVideoConstraints({
      ...videoConstraints,
      facingMode: newFacingMode
    });
    
    // Restart camera with new constraints
    setTimeout(() => {
      startCamera();
    }, 300);
  };
  
  const startCamera = async () => {
    try {
      if (activeTab === "face") {
        setCaptureStatus("idle");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { ...videoConstraints, facingMode },
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
  
  const openFaceRegistrationDialog = () => {
    setShowFaceRegisterDialog(true);
  };
  
  const handleFaceRegistered = (success: boolean) => {
    if (success) {
      // Recarregar faces registradas
      loadRegisteredFacesData();
    }
  };
  
  const handleCapture = async () => {
    setCaptureStatus("capturing");
    
    if (activeTab === "face" && cameraActive) {
      // Captura real da câmera
      try {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Configurar dimensões do canvas para corresponder ao vídeo
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Desenhar quadro do vídeo no canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Converter canvas para data URL
            const imageData = canvas.toDataURL('image/png');
            setBase64Data(imageData);
            
            // Tentar reconhecer a face comparando com faces registradas
            const recognizedFace = compareFaces(imageData, registeredFaces);
            setRecognizedFaceData(recognizedFace);
            
            // Parar stream da câmera
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setCameraActive(false);
            }
            
            // Definir status e retornar dados com informações adicionais se reconhecida
            setCaptureStatus("success");
            
            if (recognizedFace) {
              onCapture(activeTab, imageData, {
                name: recognizedFace.name,
                role: recognizedFace.role
              });
              
              toast({
                title: "Face reconhecida",
                description: `Reconhecido: ${recognizedFace.name} (${recognizedFace.role})`
              });
            } else {
              onCapture(activeTab, imageData);
              
              toast({
                title: "Captura concluída",
                description: "Face não reconhecida nos registros."
              });
            }
          }
        }
      } catch (error) {
        console.error("Erro na captura facial:", error);
        setCaptureStatus("failed");
        
        toast({
          title: "Falha na captura",
          description: "Ocorreu um erro ao tentar capturar sua imagem.",
          variant: "destructive"
        });
      }
    } else if (activeTab === "fingerprint") {
      // Simular leitor de impressão digital com um temporizador (para fins de demonstração)
      setTimeout(() => {
        // Em uma implementação real, isso se conectaria a hardware/APIs biométricos reais
        if (Math.random() > 0.2) { // Taxa de sucesso de 80% para demonstração
          const mockFingerprintData = `data:image/fingerprint;base64,${btoa(Date.now().toString())}`;
          setBase64Data(mockFingerprintData);
          setCaptureStatus("success");
          onCapture(activeTab, mockFingerprintData);
          
          toast({
            title: "Digital reconhecida",
            description: "Impressão digital capturada com sucesso."
          });
        } else {
          setCaptureStatus("failed");
          
          toast({
            title: "Falha na leitura",
            description: "Não foi possível ler a impressão digital. Tente novamente.",
            variant: "destructive"
          });
        }
      }, 2000);
    }
  };
  
  const copyBase64ToClipboard = () => {
    if (base64Data) {
      navigator.clipboard.writeText(base64Data).then(() => {
        toast({
          title: "Código copiado",
          description: "Código Base64 copiado para a área de transferência"
        });
      }).catch(err => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código Base64",
          variant: "destructive"
        });
      });
    }
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      <Tabs 
        defaultValue="face" 
        className="w-full" 
        value={activeTab}
        onValueChange={(value) => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setCameraActive(false);
          }
          setActiveTab(value as "face" | "fingerprint");
          setCaptureStatus("idle");
        }}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="face" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Reconhecimento Facial
          </TabsTrigger>
          <TabsTrigger value="fingerprint" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Impressão Digital
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="face" className="border rounded-lg p-6 flex flex-col items-center">
          {hasRegisteredFace ? (
            <div className="mb-4">
              <p className="text-sm text-gray-500 text-center">Face registrada:</p>
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mt-2">
                {registeredFaceImage && (
                  <img
                    src={registeredFaceImage}
                    alt="Face Registrada"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-500 text-center">Nenhuma face registrada.</p>
            </div>
          )}
          
          <div className="w-64 h-64 mb-4 border-2 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            {cameraActive 
              ? "Posicione seu rosto em frente à câmera para reconhecimento facial" 
              : "Clique no botão abaixo para ativar a câmera"}
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            
            <Button
              onClick={openFaceRegistrationDialog}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar Nova Face
            </Button>
            
            <Button
              onClick={startCamera}
              disabled={cameraActive}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {cameraActive ? "Câmera Ativa" : "Ativar Câmera"}
            </Button>
            
            <Button
              onClick={switchCamera}
              disabled={!cameraActive}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Trocar Câmera
            </Button>
            
            <Button
              onClick={handleCapture}
              disabled={captureStatus === "capturing" || !cameraActive}
              className="flex items-center gap-2"
            >
              {captureStatus === "capturing" ? (
                <>
                  <AlertCircle className="h-4 w-4 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Capturar
                </>
              )}
            </Button>
            
            {captureStatus === "success" && (
              <Button 
                onClick={() => setShowBase64(true)}
                variant="secondary"
              >
                <Copy className="h-4 w-4 mr-2" />
                Ver Base64
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="fingerprint" className="border rounded-lg p-6 flex flex-col items-center">
          <p className="text-sm text-gray-500 text-center mb-6">
            Clique no botão abaixo para simular a leitura da impressão digital.
          </p>
          
          <Button
            onClick={handleCapture}
            disabled={captureStatus === "capturing"}
            className="flex items-center gap-2"
          >
            {captureStatus === "capturing" ? (
              <>
                <AlertCircle className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4" />
                Verificar Digital
              </>
            )}
          </Button>
          
          {captureStatus === "success" && (
            <div className="mt-4">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 text-center">
                Impressão digital verificada com sucesso!
              </p>
              <Button 
                onClick={() => setShowBase64(true)}
                variant="secondary"
                className="mt-4"
              >
                <Copy className="h-4 w-4 mr-2" />
                Ver Base64
              </Button>
            </div>
          )}
          
          {captureStatus === "failed" && (
            <div className="mt-4">
              <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 text-center">
                Falha ao verificar a impressão digital. Tente novamente.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={showBase64} onOpenChange={setShowBase64}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Base64 da Assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              readOnly
              value={base64Data}
              className="font-mono text-xs h-48"
            />
          </div>
          <DialogFooter className="flex justify-between items-center mt-4">
            <Button onClick={() => setShowBase64(false)} variant="outline">
              Fechar
            </Button>
            <Button onClick={copyBase64ToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FaceRegistrationDialog
        open={showFaceRegisterDialog}
        onOpenChange={setShowFaceRegisterDialog}
        onClose={() => setShowFaceRegisterDialog(false)}
        onRegister={handleFaceRegistered}
      />
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default BiometricSignature;
