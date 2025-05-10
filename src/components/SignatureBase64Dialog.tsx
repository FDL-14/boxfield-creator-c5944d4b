
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureBase64DialogProps {
  open: boolean;
  onClose: () => void;
  base64Data: string;
  signatureName: string;
}

export default function SignatureBase64Dialog({
  open,
  onClose,
  base64Data,
  signatureName
}: SignatureBase64DialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(base64Data);
      setCopied(true);
      toast({
        title: "Código copiado",
        description: "O código Base64 foi copiado para a área de transferência"
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código Base64 da Assinatura</DialogTitle>
          <DialogDescription>
            Este é o código Base64 da assinatura "{signatureName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea 
            value={base64Data} 
            readOnly 
            rows={8}
            className="font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mr-2"
          >
            Fechar
          </Button>
          <Button 
            onClick={handleCopyCode}
            className="flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar código Base64
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
