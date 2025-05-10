import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Save, Undo, Redo, Copy } from "lucide-react";
import SignatureBase64Dialog from "@/components/SignatureBase64Dialog";

interface DrawSignatureProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  initialSignature?: string;
  height?: number;
  width?: number;
}

const DrawSignature: React.FC<DrawSignatureProps> = ({
  onSave,
  onCancel,
  initialSignature,
  height = 150,
  width = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentSignature, setCurrentSignature] = useState<string>("");
  const [base64DialogOpen, setBase64DialogOpen] = useState(false);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas properties
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    
    setContext(ctx);
    
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add a subtle hint line
    ctx.strokeStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.moveTo(10, canvas.height - 30);
    ctx.lineTo(canvas.width - 10, canvas.height - 30);
    ctx.stroke();
    ctx.strokeStyle = "#000000";
    
    // Save initial state
    const initialState = canvas.toDataURL();
    setHistory([initialState]);
    setHistoryIndex(0);
    
    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const newState = canvas.toDataURL();
        setHistory(prev => [...prev, newState]);
        setHistoryIndex(1);
        setCurrentSignature(newState);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);
  
  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    
    let clientX, clientY;
    
    if ('touches' in e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current!.getBoundingClientRect();
      clientX = touch.clientX - rect.left;
      clientY = touch.clientY - rect.top;
    } else {
      clientX = e.nativeEvent.offsetX;
      clientY = e.nativeEvent.offsetY;
    }
    
    context.beginPath();
    context.moveTo(clientX, clientY);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current!.getBoundingClientRect();
      clientX = touch.clientX - rect.left;
      clientY = touch.clientY - rect.top;
    } else {
      clientX = e.nativeEvent.offsetX;
      clientY = e.nativeEvent.offsetY;
    }
    
    context.lineTo(clientX, clientY);
    context.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    setIsDrawing(false);
    context.closePath();
    
    // Save current state to history
    const newState = canvasRef.current.toDataURL();
    
    // Remove any future states if we're in the middle of history
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newState]);
    setHistoryIndex(historyIndex + 1);
  };
  
  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Add a subtle hint line
    context.strokeStyle = "#e5e7eb";
    context.beginPath();
    context.moveTo(10, canvasRef.current.height - 30);
    context.lineTo(canvasRef.current.width - 10, canvasRef.current.height - 30);
    context.stroke();
    context.strokeStyle = "#000000";
    
    // Save clear state to history
    const newState = canvasRef.current.toDataURL();
    setHistory([...history, newState]);
    setHistoryIndex(history.length);
    setCurrentSignature(newState);
  };
  
  const handleUndo = () => {
    if (historyIndex <= 0 || !context || !canvasRef.current) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      context.drawImage(img, 0, 0);
    };
    img.src = history[newIndex];
  };
  
  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !context || !canvasRef.current) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      context.drawImage(img, 0, 0);
    };
    img.src = history[newIndex];
  };
  
  const handleSave = () => {
    if (!canvasRef.current) return;
    const signatureData = canvasRef.current.toDataURL();
    setCurrentSignature(signatureData);
    onSave(signatureData);
  };

  // Handle touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  return (
    <div className="signature-pad-container flex flex-col items-center">
      <div className="canvas-container border-2 border-gray-300 rounded mb-3 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex gap-2 justify-center w-full mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUndo}
          disabled={historyIndex <= 0}
        >
          <Undo className="h-4 w-4 mr-1" />
          Desfazer
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
        >
          <Redo className="h-4 w-4 mr-1" />
          Refazer
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearCanvas}
        >
          <Eraser className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>
      <div className="flex gap-2 justify-center w-full">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          variant="outline"
          onClick={showBase64Dialog}
        >
          <Copy className="h-4 w-4 mr-1" />
          Ver Base64
        </Button>
        <Button 
          onClick={handleSave}
        >
          <Save className="h-4 w-4 mr-1" />
          Salvar Assinatura
        </Button>
      </div>

      {/* Diálogo para mostrar código Base64 */}
      <SignatureBase64Dialog
        open={base64DialogOpen}
        onClose={() => setBase64DialogOpen(false)}
        base64Data={currentSignature}
        signatureName="Assinatura Manual"
      />
    </div>
  );
};

export default DrawSignature;
