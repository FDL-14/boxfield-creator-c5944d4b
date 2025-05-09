
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Fingerprint, Loader2, AlertCircle, Check, Copy } from "lucide-react";
import { registerFingerprint } from "@/utils/fingerprintUtils";

interface FingerprintRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FingerprintRegistrationDialog({ open, onOpenChange }: FingerprintRegistrationDialogProps) {
  const [name, setName] = useState("");
  const [cpf, setCPF] = useState("");
  const [role, setRole] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFingerprints, setCapturedFingerprints] = useState<string[]>([]);
  const [fingerprintBase64, setFingerprintBase64] = useState<string | null>(null);
  const [showBase64, setShowBase64] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("");
      setCPF("");
      setRole("");
      setCapturedFingerprints([]);
      setFingerprintBase64(null);
      setShowBase64(false);
      setIsCapturing(false);
    }
  }, [open]);

  // Format CPF with mask (XXX.XXX.XXX-XX)
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").substring(0, 11);
    
    if (numbers.length <= 3) {
      return numbers;
    }
    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    }
    if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    }
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Handle CPF input with formatting
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCPF(formatCPF(e.target.value));
  };

  // Start fingerprint capture
  const startCapture = async () => {
    if (!name || !cpf || !role) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, CPF e cargo para prosseguir",
        variant: "destructive"
      });
      return;
    }

    setIsCapturing(true);

    try {
      // Simulate fingerprint reader connection
      // In a real application, this would integrate with a fingerprint scanner API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate fingerprint capture
      const mockFingerprint = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEUAAAD///+l2Z/dAAABhklEQVQ4y43UsY3DMAwF0C8YA1eaBIgHyCj3TpBRPIAnyCgeIKNklG+AW6cubZEUJZuJYRi2KT4+UiLgx3t+A7zBBzh9wa0APAKsgPsrcA6wAs5A8N8gbAMMwBV4N3h1OJ1w/qD+V4DpAjCdAMYGQoOxQpPBxuBg8MlgykHV4EOsFxUewIvBLwP0BTwY/FYgGXhWoGTw2iDW7wIMdvCtQCzQOIjZgtcKokCnQIIXC54CnIFWAQ8BhvkBDEGP2UILTQYjXuCJSHpBAG/BWwXSCvQKNAQ9OsG9QKMQXxAO+JawCIcUCJfACAmnwEjBOJAZ4EQmGVorYG4gV6Dx0nDJ2Qvk3ULJZSrkVqB/qG9j/eged4G+i65/pnPuC95fo7kvGLRi7wuGrXj2BQOl5L6gK5jvCwZKyX3BsBVHXzBsxdEX9JT2+4KOUnZf0FFK7wv6QvlvwEApvS8YtuL0GXbYRA189V8w7n9RjdavZhWS1Zhn9Xx1obzab97J+vVeyjqQcf0DG5+VR7QoEW4AAAAASUVORK5CYII=`;
      
      setCapturedFingerprints(prev => [...prev, mockFingerprint]);
      setFingerprintBase64(mockFingerprint);
      
      toast({
        title: "Digital capturada",
        description: `Digital ${capturedFingerprints.length + 1} capturada com sucesso`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error during fingerprint capture:", error);
      toast({
        title: "Erro na captura",
        description: "Não foi possível capturar a digital. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Save fingerprint registration
  const handleSave = async () => {
    if (!name || !cpf || !role || capturedFingerprints.length === 0) {
      toast({
        title: "Informações incompletas",
        description: "Preencha todos os campos e capture ao menos uma digital",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save each fingerprint in the database
      for (let i = 0; i < capturedFingerprints.length; i++) {
        await registerFingerprint({
          image: capturedFingerprints[i],
          name,
          cpf,
          role,
          index: i,
          timestamp: new Date().toISOString()
        });
      }

      toast({
        title: "Registro concluído",
        description: `${capturedFingerprints.length} digital(is) registrada(s) com sucesso para ${name}`,
        variant: "default"
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving fingerprints:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as digitais. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Base64 to clipboard
  const copyBase64 = () => {
    if (fingerprintBase64) {
      navigator.clipboard.writeText(fingerprintBase64)
        .then(() => {
          toast({
            title: "Código copiado",
            description: "Código Base64 copiado para a área de transferência",
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Registro de Digitais
          </DialogTitle>
          <DialogDescription>
            Registre até 10 digitais por pessoa para uso em assinaturas digitais.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Cargo/Função</Label>
            <Input
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Cargo ou função"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Digitais Capturadas: {capturedFingerprints.length}/10</Label>
              {capturedFingerprints.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowBase64(!showBase64)}
                >
                  {showBase64 ? "Ocultar Base64" : "Mostrar Base64"}
                </Button>
              )}
            </div>
            
            {capturedFingerprints.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {capturedFingerprints.map((fp, index) => (
                  <div key={index} className="h-12 w-12 rounded border flex items-center justify-center bg-slate-50">
                    <Fingerprint className="h-8 w-8 text-slate-500" />
                  </div>
                ))}
              </div>
            )}

            {showBase64 && fingerprintBase64 && (
              <div className="mt-2 relative">
                <div className="bg-slate-100 p-2 rounded text-xs break-all overflow-auto max-h-20">
                  {fingerprintBase64}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1" 
                  onClick={copyBase64}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                variant="secondary"
                disabled={isCapturing || capturedFingerprints.length >= 10 || !name || !cpf || !role}
                onClick={startCapture}
                className="w-full max-w-xs"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Capturando...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" /> 
                    {capturedFingerprints.length === 0 
                      ? "Capturar Digital" 
                      : "Capturar Outra Digital"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {capturedFingerprints.length >= 10 && (
              <span className="flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" /> 
                Limite máximo atingido
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || capturedFingerprints.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> 
                  Salvar Digitais
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
