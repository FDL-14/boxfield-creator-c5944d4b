
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Camera, 
  CameraOff, 
  FileImage, 
  Trash2, 
  FlipHorizontal,
  Download,
  File
} from "lucide-react";
import { MediaService } from "@/services/mediaService";

interface ImageCaptureFieldProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  showBase64Toggle?: boolean;
}

export default function ImageCaptureField({
  value,
  onChange,
  label = "Imagem",
  disabled = false,
  showBase64Toggle = false
}: ImageCaptureFieldProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [base64Value, setBase64Value] = useState(value || '');
  const [showBase64, setShowBase64] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Inicializar câmera quando ativada
  useEffect(() => {
    let mounted = true;
    
    if (showCamera) {
      MediaService.startCamera(facingMode)
        .then(({ videoElement, stream, error }) => {
          if (!mounted) return;
          
          if (error) {
            setCameraError(error);
            return;
          }
          
          if (videoElement && stream) {
            setStream(stream);
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play()
                .catch(err => console.error("Erro ao iniciar reprodução de vídeo:", err));
            } else {
              // Se o ref não estiver disponível, criar um novo elemento
              videoRef.current = videoElement;
              document.getElementById('camera-container')?.appendChild(videoElement);
            }
          }
        })
        .catch(error => {
          if (mounted) {
            console.error("Erro ao iniciar câmera:", error);
            setCameraError("Não foi possível acessar a câmera");
          }
        });
    } else {
      // Desligar a câmera quando não estiver em uso
      MediaService.stopCamera(stream);
      setStream(null);
    }
    
    return () => {
      mounted = false;
      MediaService.stopCamera(stream);
    };
  }, [showCamera, facingMode]);
  
  // Limpar quando o componente for desmontado
  useEffect(() => {
    return () => {
      MediaService.stopCamera(stream);
    };
  }, []);
  
  // Atualizar valor base64 quando value mudou externamente
  useEffect(() => {
    if (value !== base64Value) {
      setBase64Value(value || '');
    }
  }, [value]);
  
  // Alternar câmera frontal/traseira
  const handleSwitchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Parar câmera atual e iniciar nova
    MediaService.stopCamera(stream);
    setStream(null);
    
    const { videoElement, stream: newStream, error } = await MediaService.startCamera(newFacingMode);
    
    if (error) {
      setCameraError(error);
      return;
    }
    
    if (videoElement && newStream) {
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play()
          .catch(err => console.error("Erro ao iniciar reprodução de vídeo:", err));
      }
    }
  };
  
  // Capturar imagem da câmera
  const handleCapture = () => {
    if (!videoRef.current) return;
    
    const imageData = MediaService.captureImage(videoRef.current);
    setBase64Value(imageData);
    onChange(imageData);
    
    // Desligar a câmera após captura
    setShowCamera(false);
  };
  
  // Remover imagem
  const handleClear = () => {
    setBase64Value('');
    onChange('');
  };
  
  // Abrir seletor de arquivo
  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Processar arquivo selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          
          // Redimensionar imagem para economizar espaço
          const resizedImage = await MediaService.resizeImage(base64);
          
          setBase64Value(resizedImage);
          onChange(resizedImage);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
    }
  };
  
  // Baixar imagem como arquivo
  const handleDownloadImage = () => {
    if (!base64Value) return;
    
    const link = document.createElement('a');
    link.href = base64Value;
    link.download = `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {!showCamera && !base64Value && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
              <p className="text-muted-foreground text-center">
                Nenhuma imagem selecionada
              </p>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCamera(true)}
                  disabled={disabled}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Usar Câmera
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChooseFile}
                  disabled={disabled}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Escolher Arquivo
                </Button>
              </div>
            </div>
          )}
          
          {showCamera && (
            <div className="relative">
              <div id="camera-container" className="w-full h-[300px] bg-black flex justify-center items-center overflow-hidden">
                {cameraError ? (
                  <div className="text-white p-4 text-center">
                    <CameraOff className="mx-auto mb-2 h-8 w-8" />
                    <p>Erro na câmera: {cameraError}</p>
                  </div>
                ) : (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  size="icon"
                  onClick={handleSwitchCamera}
                  disabled={!!cameraError}
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCapture}
                  disabled={!!cameraError}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capturar
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCamera(false)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {!showCamera && base64Value && (
            <div className="relative">
              <img 
                src={base64Value} 
                alt={label}
                className="w-full object-contain" 
                style={{ maxHeight: '300px' }}
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(true)}
                  disabled={disabled}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Nova Foto
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleChooseFile}
                  disabled={disabled}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Arquivo
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={disabled}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showBase64Toggle && base64Value && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBase64(!showBase64)}
            className="mb-2"
          >
            <File className="mr-2 h-4 w-4" />
            {showBase64 ? 'Esconder' : 'Mostrar'} Código Base64
          </Button>
          
          {showBase64 && (
            <div className="bg-gray-100 p-2 rounded-md">
              <pre className="text-xs overflow-auto max-h-[100px]">
                {base64Value}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {/* Input de arquivo escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
