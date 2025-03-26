
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FaceRecognition, Fingerprint } from "lucide-react";

interface BiometricSignatureProps {
  onCapture: (type: "face" | "fingerprint", data: string) => void;
  onCancel: () => void;
}

const BiometricSignature: React.FC<BiometricSignatureProps> = ({
  onCapture,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<"face" | "fingerprint">("face");
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "success" | "failed">("idle");
  
  const handleCapture = () => {
    setCaptureStatus("capturing");
    
    // Simulate capture process
    setTimeout(() => {
      // In a real implementation, this would connect to actual biometric hardware/APIs
      if (Math.random() > 0.2) { // 80% success rate for demo
        setCaptureStatus("success");
        const mockBiometricData = `data:image/${activeTab === "face" ? "face" : "fingerprint"};base64,${btoa(Date.now().toString())}`;
        onCapture(activeTab, mockBiometricData);
      } else {
        setCaptureStatus("failed");
      }
    }, 2000);
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      <Tabs 
        defaultValue="face" 
        className="w-full" 
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "face" | "fingerprint");
          setCaptureStatus("idle");
        }}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="face" className="flex items-center gap-2">
            <FaceRecognition className="h-4 w-4" />
            Reconhecimento Facial
          </TabsTrigger>
          <TabsTrigger value="fingerprint" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Impressão Digital
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="face" className="border rounded-lg p-6 flex flex-col items-center">
          <div className="w-64 h-64 mb-4 border-2 rounded-lg flex items-center justify-center bg-gray-50">
            {captureStatus === "idle" && (
              <FaceRecognition className="h-20 w-20 text-gray-300" />
            )}
            {captureStatus === "capturing" && (
              <div className="flex flex-col items-center">
                <FaceRecognition className="h-20 w-20 text-blue-500 animate-pulse" />
                <p className="mt-2 text-sm text-gray-500">Escaneando...</p>
              </div>
            )}
            {captureStatus === "success" && (
              <div className="flex flex-col items-center">
                <FaceRecognition className="h-20 w-20 text-green-500" />
                <p className="mt-2 text-sm text-green-600">Reconhecimento bem sucedido!</p>
              </div>
            )}
            {captureStatus === "failed" && (
              <div className="flex flex-col items-center">
                <FaceRecognition className="h-20 w-20 text-red-500" />
                <p className="mt-2 text-sm text-red-600">Falha no reconhecimento!</p>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            Posicione seu rosto em frente à câmera para reconhecimento facial
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
