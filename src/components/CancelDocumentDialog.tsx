
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash, Plus, UploadCloud, AlertTriangle } from "lucide-react";
import DrawSignature from "./DrawSignature";
import { useToast } from "@/hooks/use-toast";

export interface CancelDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: string, approvers: any[]) => void;
}

export default function CancelDocumentDialog({
  open,
  onClose,
  onCancel
}: CancelDocumentDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [approvers, setApprovers] = useState([{ name: "", role: "", signature: "" }]);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [currentApproverIndex, setCurrentApproverIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddApprover = () => {
    setApprovers([...approvers, { name: "", role: "", signature: "" }]);
  };

  const handleRemoveApprover = (index: number) => {
    if (approvers.length <= 1) return;
    const newApprovers = [...approvers];
    newApprovers.splice(index, 1);
    setApprovers(newApprovers);
  };

  const handleApproverChange = (index: number, field: string, value: string) => {
    const newApprovers = [...approvers];
    newApprovers[index] = { ...newApprovers[index], [field]: value };
    setApprovers(newApprovers);
  };

  const openSignatureDialog = (index: number) => {
    setCurrentApproverIndex(index);
    setShowSignatureDialog(true);
  };

  const handleSaveSignature = (signatureData: string) => {
    try {
      const newApprovers = [...approvers];
      newApprovers[currentApproverIndex].signature = signatureData;
      setApprovers(newApprovers);
      setShowSignatureDialog(false);
      
      toast({
        title: "Assinatura adicionada",
        description: "A assinatura foi adicionada com sucesso."
      });
    } catch (error) {
      console.error("Erro ao adicionar assinatura:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a assinatura.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = () => {
    try {
      setIsSubmitting(true);
      
      // Validação
      if (!reason.trim()) {
        toast({
          title: "Erro",
          description: "Informe um motivo para o cancelamento.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (approvers.some(a => !a.name.trim() || !a.role.trim() || !a.signature)) {
        toast({
          title: "Erro",
          description: "Todos os aprovadores precisam ter nome, cargo e assinatura.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Logando dados para depuração
      console.log("Dados de cancelamento:", {
        reason,
        approvers
      });
      
      // Chamar a função de cancelamento
      onCancel(reason, approvers);
      
      // Feedback ao usuário
      toast({
        title: "Documento cancelado",
        description: "O documento foi marcado como cancelado com sucesso."
      });
      
      // Resetar formulário e fechar diálogo
      onClose();
      setReason("");
      setApprovers([{ name: "", role: "", signature: "" }]);
    } catch (error) {
      console.error("Erro ao cancelar documento:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cancelar o documento.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Documento</DialogTitle>
            <DialogDescription>
              O documento será marcado como cancelado e exibirá uma marca d'água quando for visualizado ou impresso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-start gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Esta ação não pode ser desfeita. O documento será permanentemente marcado como cancelado.
              </p>
            </div>
            
            <div>
              <Label htmlFor="cancel-reason" className="mb-2 block">Motivo do Cancelamento</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Informe o motivo do cancelamento"
                className="resize-none min-h-[100px]"
                required
              />
            </div>
            
            <div className="space-y-4">
              <Label className="block">Aprovadores</Label>
              {approvers.map((approver, index) => (
                <div key={index} className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Aprovador {index + 1}</h4>
                    {approvers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveApprover(index)}
                        className="h-7 text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`approver-name-${index}`} className="mb-1 block text-sm">Nome</Label>
                      <Input
                        id={`approver-name-${index}`}
                        value={approver.name}
                        onChange={(e) => handleApproverChange(index, "name", e.target.value)}
                        placeholder="Nome"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`approver-role-${index}`} className="mb-1 block text-sm">Cargo</Label>
                      <Input
                        id={`approver-role-${index}`}
                        value={approver.role}
                        onChange={(e) => handleApproverChange(index, "role", e.target.value)}
                        placeholder="Cargo"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-1 block text-sm">Assinatura</Label>
                    {approver.signature ? (
                      <div className="flex items-center justify-between border rounded p-2">
                        <img 
                          src={approver.signature} 
                          alt="Assinatura" 
                          className="h-12" 
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openSignatureDialog(index)}
                        >
                          <UploadCloud className="h-4 w-4 mr-1" />
                          Alterar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => openSignatureDialog(index)}
                      >
                        <UploadCloud className="h-4 w-4 mr-1" />
                        Adicionar Assinatura
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddApprover}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Aprovador
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting || !reason.trim() || approvers.some(a => !a.name.trim() || !a.role.trim() || !a.signature)}
            >
              {isSubmitting ? "Processando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showSignatureDialog && (
        <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Desenhar Assinatura</DialogTitle>
              <DialogDescription>
                Use o mouse ou toque para desenhar sua assinatura abaixo
              </DialogDescription>
            </DialogHeader>
            <DrawSignature 
              onSave={handleSaveSignature} 
              onCancel={() => setShowSignatureDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
