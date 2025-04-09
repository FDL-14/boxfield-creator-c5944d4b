
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Fingerprint, Camera, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [videoConstraints, setVideoConstraints] = useState({
    width: 640,
    height: 480,
    facingMode: "user"
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Initialize camera when component mounts
  useEffect(() => {
    return () => {
      // Cleanup function to stop the camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  const startCamera = async () => {
    try {
      if (activeTab === "face") {
        setCaptureStatus("idle");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
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
          setCaptureStatus("success");
          const mockFingerprintData = `data:image/fingerprint;base64,${btoa(Date.now().toString())}`;
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BiometricSignature;
