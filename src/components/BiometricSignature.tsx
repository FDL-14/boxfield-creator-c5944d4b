
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Fingerprint, Camera, AlertCircle, CheckCircle, RotateCcw, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface BiometricSignatureProps {
  onCapture: (type: "face" | "fingerprint", data: string) => void;
  onCancel: () => void;
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
  
  // Check local storage for registered face on component mount
  useEffect(() => {
    const storedFace = localStorage.getItem('registeredFace');
    if (storedFace) {
      setHasRegisteredFace(true);
      setRegisteredFaceImage(storedFace);
    }
  }, []);
  
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
  
  const registerFace = async () => {
    if (registeredFaceImage) {
      // If already registered, just use this face
      onCapture(activeTab, registeredFaceImage);
      setCaptureStatus("success");
      return;
    }
    
    if (!cameraActive) {
      startCamera();
      return;
    }
    
    setCaptureStatus("capturing");
    
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const imageData = canvas.toDataURL('image/png');
          
          // Store in localStorage for future use
          localStorage.setItem('registeredFace', imageData);
          setRegisteredFaceImage(imageData);
          setHasRegisteredFace(true);
          
          // Stop camera stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setCameraActive(false);
          }
          
          // Set status and return data
          setCaptureStatus("success");
          setBase64Data(imageData);
          
          toast({
            title: "Face registrada",
            description: "Seu rosto foi registrado com sucesso para uso futuro."
          });
        }
      }
    } catch (error) {
      console.error("Erro na captura facial:", error);
      setCaptureStatus("failed");
      
      toast({
        title: "Falha no registro",
        description: "Ocorreu um erro ao tentar registrar sua face.",
        variant: "destructive"
      });
    }
  };
  
  const handleCapture = async () => {
    setCaptureStatus("capturing");
    
    if (activeTab === "face" && cameraActive) {
      // Real camera capture
      try {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to data URL
            const imageData = canvas.toDataURL('image/png');
            setBase64Data(imageData);
            
            // Stop camera stream
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setCameraActive(false);
            }
            
            // Set status and return data
            setCaptureStatus("success");
            onCapture(activeTab, imageData);
            
            toast({
              title: "Captura concluída",
              description: "Reconhecimento facial concluído com sucesso."
            });
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
      // Simulate fingerprint reader with a timer (for demo purposes)
      setTimeout(() => {
        // In a real implementation, this would connect to actual biometric hardware/APIs
        if (Math.random() > 0.2) { // 80% success rate for demo
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
          {hasRegisteredFace && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg w-full">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-700">Face já registrada</p>
              </div>
              {registeredFaceImage && (
                <div className="mt-2 flex items-center justify-center">
                  <img 
                    src={registeredFaceImage} 
                    alt="Face registrada" 
                    className="w-24 h-24 object-cover rounded-full border-2 border-green-300"
                  />
                </div>
              )}
              <p className="text-sm text-green-600 mt-2">
                Você já possui uma face registrada. Você pode usar esta mesma face ou registrar uma nova.
              </p>
            </div>
          )}
          
          <div className="w-64 h-64 mb-4 border-2 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden">
            {captureStatus === "idle" && !cameraActive && (
              <User className="h-20 w-20 text-gray-300" />
            )}
            
            {/* Video element for camera capture */}
            <video 
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              autoPlay 
              playsInline
              muted
            />
            
            {/* Hidden canvas for capturing frames */}
            <canvas 
              ref={canvasRef} 
              className="hidden" 
            />
            
            {captureStatus === "capturing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <Camera className="h-20 w-20 text-blue-500 animate-pulse" />
                <p className="mt-2 text-sm text-white">Escaneando...</p>
              </div>
            )}
            
            {captureStatus === "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <CheckCircle className="h-20 w-20 text-green-500" />
                <p className="mt-2 text-sm text-white">Reconhecimento bem sucedido!</p>
              </div>
            )}
            
            {captureStatus === "failed" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <AlertCircle className="h-20 w-20 text-red-500" />
                <p className="mt-2 text-sm text-white">Falha no reconhecimento!</p>
              </div>
            )}
            
            {cameraActive && (
              <Button 
                size="icon"
                variant="secondary"
                className="absolute bottom-2 left-2 rounded-full"
                onClick={switchCamera}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            {cameraActive 
              ? "Posicione seu rosto em frente à câmera para reconhecimento facial" 
              : "Clique no botão abaixo para ativar a câmera"}
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            
            {!hasRegisteredFace && !cameraActive && captureStatus !== "success" && (
              <Button 
                onClick={registerFace}
                disabled={captureStatus === "capturing"}
                variant="default"
              >
                <Camera className="h-4 w-4 mr-2" />
                Registrar Face
              </Button>
            )}
            
            {!cameraActive && captureStatus !== "success" ? (
              <Button 
                onClick={startCamera}
                disabled={captureStatus === "capturing"}
                variant="default"
              >
                <Camera className="h-4 w-4 mr-2" />
                Ativar Câmera
              </Button>
            ) : (
              <Button 
                onClick={handleCapture}
                disabled={captureStatus === "capturing" || !cameraActive || captureStatus === "success"}
                variant={captureStatus === "success" ? "outline" : "default"}
              >
                {captureStatus === "capturing" ? "Processando..." : 
                 captureStatus === "success" ? "Capturado" : 
                 captureStatus === "failed" ? "Tentar Novamente" : "Capturar"}
              </Button>
            )}
            
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
          <div className="w-64 h-64 mb-4 border-2 rounded-lg flex items-center justify-center bg-gray-50">
            {captureStatus === "idle" && (
              <Fingerprint className="h-20 w-20 text-gray-300" />
            )}
            {captureStatus === "capturing" && (
              <div className="flex flex-col items-center">
                <Fingerprint className="h-20 w-20 text-blue-500 animate-pulse" />
                <p className="mt-2 text-sm text-gray-500">Escaneando...</p>
              </div>
            )}
            {captureStatus === "success" && (
              <div className="flex flex-col items-center">
                <Fingerprint className="h-20 w-20 text-green-500" />
                <p className="mt-2 text-sm text-green-600">Digital reconhecida!</p>
              </div>
            )}
            {captureStatus === "failed" && (
              <div className="flex flex-col items-center">
                <Fingerprint className="h-20 w-20 text-red-500" />
                <p className="mt-2 text-sm text-red-600">Falha no reconhecimento!</p>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            Posicione seu dedo no leitor biométrico para capturar sua impressão digital
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCapture}
              disabled={captureStatus === "capturing"}
              variant={captureStatus === "success" ? "outline" : "default"}
            >
              {captureStatus === "capturing" ? "Processando..." : 
               captureStatus === "success" ? "Capturado" : 
               captureStatus === "failed" ? "Tentar Novamente" : "Capturar"}
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
      </Tabs>
      
      {/* Dialog para exibir código Base64 */}
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
    </div>
  );
};

export default BiometricSignature;
