
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  documentTitle: string;
  documentData: any;
}

export default function EmailDocumentDialog({
  open,
  onClose,
  documentTitle,
  documentData
}: EmailDocumentDialogProps) {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState(`Documento: ${documentTitle}`);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipients.trim()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe pelo menos um destinatário",
        variant: "destructive"
      });
      return;
    }

    // Simulação do envio de e-mail
    setIsSending(true);
    
    // Em um ambiente real, você enviaria os dados para um backend
    // que processaria o envio do e-mail com os anexos
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "E-mail enviado",
        description: "O documento foi enviado por e-mail com sucesso"
      });
      onClose();
      
      // Limpar campos
      setRecipients("");
      setSubject(`Documento: ${documentTitle}`);
      setMessage("");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento por E-mail</DialogTitle>
          <DialogDescription>
            Envie este documento como anexo para os destinatários desejados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSendEmail} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="recipients">Destinatários</Label>
            <Input
              id="recipients"
              type="text"
              placeholder="email@exemplo.com, email2@exemplo.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Separe múltiplos endereços com vírgula.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Digite uma mensagem para acompanhar o documento..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
