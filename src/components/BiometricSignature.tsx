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

interface BiometricSignatureProps {
  onCapture: (type: "face" | "fingerprint", data: string, additionalData?: any) => void;
  onCancel: () => void;
}

interface FaceRegistration {
  image: string;
  name: string;
  role: string;
  timestamp: string;
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
  const [registrationName, setRegistrationName] = useState("");
  const [registrationRole, setRegistrationRole] = useState("");
  const [registeredFaces, setRegisteredFaces] = useState<FaceRegistration[]>([]);
  const [recognizedFaceData, setRecognizedFaceData] = useState<FaceRegistration | null>(null);
  
  // Check local storage for registered faces on component mount
  useEffect(() => {
    loadRegisteredFaces();
  }, []);
  
  const loadRegisteredFaces = () => {
    try {
      // Load from localStorage
      const storedFaces = localStorage.getItem('registeredFaces');
      if (storedFaces) {
        const parsedFaces = JSON.parse(storedFaces) as FaceRegistration[];
        setRegisteredFaces(parsedFaces);
        
        // If there's at least one registered face, consider faces as registered
        if (parsedFaces.length > 0) {
          setHasRegisteredFace(true);
          setRegisteredFaceImage(parsedFaces[0].image);
        }
      }
      
      // Try to get from Supabase if connected
      tryLoadFacesFromSupabase();
    } catch (error) {
      console.error("Erro ao carregar faces registradas:", error);
    }
  };
  
  const tryLoadFacesFromSupabase = async () => {
    try {
      // Check if supabase is initialized and user is authenticated
      const session = await supabase.auth.getSession();
      if (session && session.data.session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_face_registered', true);
        
        if (error) {
          console.error("Erro ao carregar faces do Supabase:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Type assertion to ensure data is treated as Profile[]
          const profiles = data as Profile[];
          
          // Convert to our format
          const faces = profiles
            .filter(d => d.face_image) // Only include profiles with face_image
            .map(d => ({
              image: d.face_image || '',
              name: d.name || '',
              role: d.role || '',
              timestamp: d.updated_at || new Date().toISOString()
            }));
          
          // Merge with local storage data, prioritizing Supabase data
          const mergedFaces = [...faces];
          setRegisteredFaces(mergedFaces);
          
          // Update localStorage with the merged data
          localStorage.setItem('registeredFaces', JSON.stringify(mergedFaces));
          
          // Set registered face state
          if (faces.length > 0) {
            setHasRegisteredFace(true);
            setRegisteredFaceImage(faces[0].image);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao tentar carregar do Supabase:", error);
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
  
  const openFaceRegistrationDialog = async () => {
    if (!cameraActive) {
      startCamera();
    }
    setShowFaceRegisterDialog(true);
  };
  
  const registerNewFace = async () => {
    if (!cameraActive) {
      startCamera();
      return;
    }
    
    if (!registrationName || !registrationRole) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e cargo para registrar a face",
        variant: "destructive"
      });
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
          
          // Create new face registration object
          const newFace: FaceRegistration = {
            image: imageData,
            name: registrationName,
            role: registrationRole,
            timestamp: new Date().toISOString()
          };
          
          // Update registered faces
          const updatedFaces = [...registeredFaces, newFace];
          setRegisteredFaces(updatedFaces);
          
          // Store in localStorage for future use
          localStorage.setItem('registeredFaces', JSON.stringify(updatedFaces));
          setRegisteredFaceImage(imageData);
          setHasRegisteredFace(true);
          
          // Try to save to Supabase if connected
          trySaveToSupabase(newFace);
          
          // Stop camera stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setCameraActive(false);
          }
          
          // Set status and return data
          setCaptureStatus("success");
          setBase64Data(imageData);
          setShowFaceRegisterDialog(false);
          
          // Reset form fields
          setRegistrationName("");
          setRegistrationRole("");
          
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
  
  const trySaveToSupabase = async (faceData: FaceRegistration) => {
    try {
      // Check if supabase is initialized and user is authenticated
      const session = await supabase.auth.getSession();
      if (session && session.data.session) {
        // Update or insert the profile with face data
        const { error } = await supabase
          .from('profiles')
          .update({
            face_image: faceData.image,
            name: faceData.name,
            role: faceData.role,
            is_face_registered: true
          })
          .eq('id', session.data.session.user.id);
        
        if (error) {
          console.error("Erro ao salvar face no Supabase:", error);
          // Continue anyway since we saved to localStorage
        } else {
          console.log("Face salva com sucesso no Supabase");
        }
      }
    } catch (error) {
      console.error("Erro ao tentar salvar no Supabase:", error);
      // Continue anyway since we saved to localStorage
    }
  };
  
  // Function to compare faces and find a match
  const recognizeFace = (capturedImage: string): FaceRegistration | null => {
    // In a real app, this would use a face comparison API
    // For this demo, we'll just check if we have registered faces and return the first one
    if (registeredFaces.length > 0) {
      return registeredFaces[0];
    }
    return null;
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
            
            // Try to recognize the face
            const recognizedFace = recognizeFace(imageData);
            setRecognizedFaceData(recognizedFace);
            
            // Stop camera stream
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setCameraActive(false);
            }
            
            // Set status and return data with additional info if recognized
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
              
              {registeredFaces.length > 0 && (
                <div className="mt-2 text-sm text-green-700">
                  <p className="font-medium">Faces registradas ({registeredFaces.length}):</p>
                  <ul className="mt-1">
                    {registeredFaces.slice(0, 3).map((face, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {face.name} - {face.role}
                      </li>
                    ))}
                    {registeredFaces.length > 3 && (
                      <li className="text-xs italic">...e mais {registeredFaces.length - 3} registros</li>
                    )}
                  </ul>
                </div>
              )}
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
                {recognizedFaceData && (
                  <div className="mt-2 text-white text-center">
                    <p className="font-medium">{recognizedFaceData.name}</p>
                    <p className="text-xs">{recognizedFaceData.role}</p>
                  </div>
                )}
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
      
      {/* Dialog para cadastro de face */}
      <Dialog open={showFaceRegisterDialog} onOpenChange={setShowFaceRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro de Face</DialogTitle>
            <DialogDescription>
              Registre seu rosto com nome e cargo para reconhecimento futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="w-full flex justify-center">
              {cameraActive ? (
                <div className="relative w-64 h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay 
                    playsInline
                    muted
                  />
                  <Button 
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-2 right-2 rounded-full"
                    onClick={switchCamera}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-64 h-64 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <Button
                    onClick={startCamera}
                    variant="outline"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Ativar Câmera
                  </Button>
                </div>
              )}
            </div>
            
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
                setShowFaceRegisterDialog(false);
                if (stream) {
                  stream.getTracks().forEach(track => track.stop());
                  setCameraActive(false);
                }
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={registerNewFace}
              disabled={!cameraActive || !registrationName || !registrationRole}
            >
              Registrar Face
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
