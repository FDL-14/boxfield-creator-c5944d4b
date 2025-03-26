
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import DrawSignature from "./DrawSignature";

interface Approver {
  id: string;
  name: string;
  position: string;
  signature: string;
}

interface CancelDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: string, approvers: Approver[]) => void;
}

const CancelDocumentDialog: React.FC<CancelDocumentDialogProps> = ({
  open,
  onClose,
  onCancel,
}) => {
  const [reason, setReason] = useState("");
  const [approvers, setApprovers] = useState<Approver[]>([
    { id: "1", name: "", position: "", signature: "" },
  ]);
  const [activeSignatureIndex, setActiveSignatureIndex] = useState<number | null>(null);

  const addApprover = () => {
    setApprovers([
      ...approvers,
      { 
        id: Date.now().toString(), 
        name: "", 
        position: "", 
        signature: "" 
      },
    ]);
  };

  const removeApprover = (index: number) => {
    if (approvers.length > 1) {
      const newApprovers = [...approvers];
      newApprovers.splice(index, 1);
      setApprovers(newApprovers);
    }
  };

  const updateApprover = (index: number, field: keyof Approver, value: string) => {
    const newApprovers = [...approvers];
    newApprovers[index] = { ...newApprovers[index], [field]: value };
    setApprovers(newApprovers);
  };

  const handleSignatureStart = (index: number) => {
    setActiveSignatureIndex(index);
  };

  const handleSignatureSave = (signatureData: string) => {
    if (activeSignatureIndex !== null) {
      updateApprover(activeSignatureIndex, "signature", signatureData);
      setActiveSignatureIndex(null);
    }
  };

  const handleSignatureCancel = () => {
    setActiveSignatureIndex(null);
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Por favor, informe um motivo para o cancelamento");
      return;
    }

    const isValid = approvers.every(approver => 
      approver.name.trim() && 
      approver.position.trim() && 
      approver.signature
    );

    if (!isValid) {
      alert("Por favor, preencha todos os campos de nome, cargo e assinatura");
      return;
    }

    onCancel(reason, approvers);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Cancelamento de Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="reason" className="font-medium mb-1 block">
              Motivo do Cancelamento
            </Label>
            <Textarea
              id="reason"
              placeholder="Informe o motivo detalhado para o cancelamento deste documento"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">
                Aprovadores do Cancelamento
              </Label>
              <Button
                type="button"
                size="sm"
                onClick={addApprover}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Aprovador
              </Button>
            </div>

            <div className="space-y-6">
              {approvers.map((approver, index) => (
                <div 
                  key={approver.id} 
                  className="p-4 border rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Aprovador {index + 1}</h3>
                    {approvers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeApprover(index)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`name-${index}`} className="mb-1 block">
                        Nome
                      </Label>
                      <Input
                        id={`name-${index}`}
                        value={approver.name}
                        onChange={(e) => updateApprover(index, "name", e.target.value)}
                        placeholder="Nome do aprovador"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`position-${index}`} className="mb-1 block">
                        Cargo
                      </Label>
                      <Input
                        id={`position-${index}`}
                        value={approver.position}
                        onChange={(e) => updateApprover(index, "position", e.target.value)}
                        placeholder="Cargo do aprovador"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1 block">Assinatura</Label>
                    {approver.signature ? (
                      <div className="border rounded p-2 bg-white mb-2">
                        <img
                          src={approver.signature}
                          alt="Assinatura"
                          className="max-h-[80px] mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded p-6 text-center text-gray-500 mb-2">
                        Nenhuma assinatura
                      </div>
                    )}
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSignatureStart(index)}
                    >
                      {approver.signature ? "Alterar Assinatura" : "Assinar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>

      {activeSignatureIndex !== null && (
        <Dialog open={true} onOpenChange={handleSignatureCancel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assinatura Digital</DialogTitle>
            </DialogHeader>
            <DrawSignature
              onSave={handleSignatureSave}
              onCancel={handleSignatureCancel}
              width={400}
              height={200}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default CancelDocumentDialog;
