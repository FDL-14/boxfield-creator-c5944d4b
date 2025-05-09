
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Code } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getSignatureBase64 } from "@/utils/faceRecognition";

interface SignatureBase64DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatureImage: string;
  signatureType: "draw" | "face" | "fingerprint";
}

export default function SignatureBase64Dialog({ 
  open, 
  onOpenChange, 
  signatureImage, 
  signatureType 
}: SignatureBase64DialogProps) {
  const [base64Code, setBase64Code] = useState<string>("");
  
  useEffect(() => {
    if (open && signatureImage) {
      const code = getSignatureBase64(signatureImage);
      setBase64Code(code);
    }
  }, [open, signatureImage]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(base64Code)
      .then(() => {
        toast({
          title: "Código copiado",
          description: "O código Base64 foi copiado para a área de transferência",
          variant: "default"
        });
      })
      .catch(err => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código",
          variant: "destructive"
        });
      });
  };
  
  // Determine signature type title
  const getSignatureTypeTitle = () => {
    switch (signatureType) {
      case "draw":
        return "Assinatura Manual";
      case "face":
        return "Assinatura Facial";
      case "fingerprint":
        return "Assinatura Digital";
      default:
        return "Assinatura";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Código Base64 - {getSignatureTypeTitle()}
          </DialogTitle>
          <DialogDescription>
            Este é o código Base64 da assinatura que pode ser usado para verificação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Imagem da assinatura:</span>
            {signatureImage && (
              <div className="border rounded p-1 w-32 h-16 flex items-center justify-center overflow-hidden">
                <img 
                  src={signatureImage} 
                  alt="Assinatura" 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="bg-slate-100 p-3 rounded-md text-xs font-mono overflow-y-auto max-h-64">
              {base64Code || "Código não disponível"}
            </div>
            {base64Code && (
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2" 
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
