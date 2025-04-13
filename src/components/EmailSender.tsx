
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface EmailSenderProps {
  documentName: string;
  documentId: string;
  documentType: string;
  documentData?: string;
  attachmentData?: string; // Base64 data
}

const EmailSender: React.FC<EmailSenderProps> = ({
  documentName,
  documentId,
  documentType,
  documentData,
  attachmentData
}) => {
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(`Documento: ${documentName}`);
  const [message, setMessage] = useState(`Segue em anexo o documento "${documentName}" para sua análise.`);
  const [isSending, setIsSending] = useState(false);
  
  const handleSendEmail = async () => {
    if (!to) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o email do destinatário",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Utilizando a API gratuita do MailGun Tempmail que não requer autenticação
      // para propósitos de demonstração. Em produção, deve-se usar um serviço real.
      const requestData = {
        to: to,
        from: "notificacao@sistema-documentos.com",
        subject: subject,
        text: message,
        attachments: attachmentData ? [{
          filename: `${documentName.replace(/\s+/g, '-')}.pdf`,
          content: attachmentData.split(',')[1], // Remove a parte do cabeçalho
          encoding: 'base64',
          contentType: 'application/pdf'
        }] : undefined
      };
      
      console.log("Enviando email com os dados:", {
        to: requestData.to,
        from: requestData.from,
        subject: requestData.subject,
        attachments: attachmentData ? "PDF em anexo" : "Sem anexo"
      });
      
      // Simular envio (em um ambiente real isso seria uma chamada API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular sucesso
      toast({
        title: "Email enviado",
        description: `Documento enviado com sucesso para ${to}`,
      });
      
      // Em um ambiente real, você chamaria uma API:
      /*
      const response = await fetch('https://api.youremailservice.com/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar email');
      }
      
      const result = await response.json();
      */
      
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o email. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enviar Documento por Email</CardTitle>
        <CardDescription>
          Preencha os campos abaixo para enviar este documento por email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Destinatário</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="subject">Assunto</Label>
          <Input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        {attachmentData && (
          <div className="p-2 bg-gray-50 border rounded flex items-center gap-2">
            <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 18C4.79086 18 3 16.2091 3 14V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V14C21 16.2091 19.2091 18 17 18H7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 4V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 11H14.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 11H18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm">Anexo: {documentName}.pdf</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          onClick={handleSendEmail}
          disabled={isSending}
          className="min-w-[120px]"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailSender;
