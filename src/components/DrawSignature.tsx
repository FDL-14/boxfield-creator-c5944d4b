
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Download, Code } from "lucide-react";
import SignatureBase64Dialog from "./SignatureBase64Dialog";

interface DrawSignatureProps {
  onSignatureCapture: (base64: string) => void;
  onClose: () => void;
  initialSignature?: string | null;
  // Add compatibility with older code that uses onSave instead of onSignatureCapture
  onSave?: (base64: string) => void;
  onCancel?: () => void;
}

export default function DrawSignature({ onSignatureCapture, onClose, initialSignature = null, onSave, onCancel }: DrawSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [base64Signature, setBase64Signature] = useState('');
  const [showBase64DialogOpen, setShowBase64DialogOpen] = useState(false);
  const { toast } = useToast();

  // Support both new and old prop patterns
  const handleCapture = (base64: string) => {
    if (onSignatureCapture) onSignatureCapture(base64);
    if (onSave) onSave(base64);
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas context
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.src = initialSignature;
      img.onload = () => {
        if (ctx && canvas) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasSignature(true);
          setBase64Signature(initialSignature);
        }
      };
    }
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    setHasSignature(true);
    setBase64Signature(base64);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setBase64Signature('');
  };

  const handleSave = () => {
    if (!hasSignature) {
      toast({
        title: "Assinatura vazia",
        description: "Desenhe uma assinatura antes de salvar",
        variant: "destructive"
      });
      return;
    }
    handleCapture(base64Signature);
    handleClose();
  };

  const showBase64Dialog = () => {
    if (!hasSignature) {
      toast({
        title: "Assinatura vazia",
        description: "Desenhe uma assinatura antes de exibir o código",
        variant: "destructive"
      });
      return;
    }
    
    setShowBase64DialogOpen(true);
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="border border-gray-300 rounded cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClear}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Limpar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={showBase64Dialog}
          className="text-blue-600 border-blue-600 hover:bg-blue-600/10"
        >
          <Code className="mr-2 h-4 w-4" /> Ver Base64
        </Button>
        <Button 
          type="button" 
          onClick={handleSave}
          disabled={!hasSignature}
        >
          <Download className="mr-2 h-4 w-4" /> Salvar
        </Button>
      </div>
      
      <SignatureBase64Dialog
        open={showBase64DialogOpen}
        onClose={() => setShowBase64DialogOpen(false)}
        onOpenChange={setShowBase64DialogOpen}
        base64Data={base64Signature}
        signatureName="Assinatura"
      />
    </div>
  );
}
