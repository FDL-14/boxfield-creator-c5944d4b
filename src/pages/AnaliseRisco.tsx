
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft, Save, Printer, Download } from "lucide-react";
import { saveFormData } from "@/utils/formUtils";
import { generatePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { 
  FormHeader,
  SectionHeader,
  FormTable,
  FormRow,
  FormCell,
  FormCheckbox,
  FormInput,
  FormSignatureField
} from "@/components/form-templates/FormStyles";

export default function AnaliseRisco() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("Análise Preliminar de Risco");
  const [formState, setFormState] = useState({
    atividade: "",
    local: "",
    data: new Date().toISOString().split('T')[0],
    responsavel: "",
    departamento: "",
    riscos: {
      queda: false,
      prensamento: false,
      eletrico: false,
      queimaduras: false,
      ergonomico: false,
      outros: false,
      outrosTexto: ""
    },
    epi: {
      capacete: false,
      luvas: false,
      oculos: false,
      protetor: false,
      calcado: false,
      cinto: false,
      outros: false,
      outrosTexto: ""
    },
    medidas: "",
    assinaturas: {
      responsavel: "",
      supervisor: "",
      seguranca: ""
    }
  });
  
  const formRef = useRef(null);

  const handleInputChange = (section, field, value) => {
    setFormState(prevState => ({
      ...prevState,
      [section]: typeof prevState[section] === 'object' ? 
        { ...prevState[section], [field]: value } : 
        value
    }));
  };

  const handlePrint = useReactToPrint({
    content: () => formRef.current,
    documentTitle: documentTitle
  });

  const handleExportPDF = async () => {
    const success = await generatePDF(formRef.current, documentTitle);
    
    if (success) {
      toast({
        title: "PDF gerado",
        description: "O documento foi exportado para PDF com sucesso"
      });
    } else {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive"
      });
    }
  };

  const handleSaveDocument = () => {
    if (!documentTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para o documento",
        variant: "destructive"
      });
      return;
    }
    
    const success = saveFormData("analise-risco", documentTitle, {
      title: documentTitle,
      data: formState,
      date: new Date().toISOString()
    });
    
    if (success) {
      toast({
        title: "Documento salvo",
        description: "O documento foi salvo com sucesso"
      });
      setSaveDialogOpen(false);
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o documento",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Análise Preliminar de Risco</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Preencha todos os campos e salve ou imprima o documento
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSaveDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Como
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-md shadow-sm" ref={formRef}>
          <FormHeader 
            title="Análise Preliminar de Risco" 
            number="APR-001" 
            revision="1"
          />

          <div className="p-4 space-y-6">
            {/* Seção 1: Informações Gerais */}
            <div>
              <SectionHeader title="INFORMAÇÕES GERAIS" number="1" />
              <FormTable>
                <tbody>
                  <FormRow>
                    <FormCell width="25%">
                      <p className="font-semibold mb-1">Atividade:</p>
                      <FormInput 
                        placeholder={formState.atividade || "Digite a atividade"}
                        className={formState.atividade ? "text-black" : "text-gray-500"}
                      />
                    </FormCell>
                    <FormCell width="25%">
                      <p className="font-semibold mb-1">Local:</p>
                      <FormInput 
                        placeholder={formState.local || "Digite o local"}
                        className={formState.local ? "text-black" : "text-gray-500"}
                      />
                    </FormCell>
                    <FormCell width="25%">
                      <p className="font-semibold mb-1">Data:</p>
                      <FormInput 
                        placeholder={formState.data || "Data"}
                        className={formState.data ? "text-black" : "text-gray-500"}
                      />
                    </FormCell>
                    <FormCell width="25%">
                      <p className="font-semibold mb-1">Departamento:</p>
                      <FormInput 
                        placeholder={formState.departamento || "Digite o departamento"}
                        className={formState.departamento ? "text-black" : "text-gray-500"}
                      />
                    </FormCell>
                  </FormRow>
                  <FormRow>
                    <FormCell width="100%" span={4}>
                      <p className="font-semibold mb-1">Responsável:</p>
                      <FormInput 
                        placeholder={formState.responsavel || "Nome do responsável"}
                        className={formState.responsavel ? "text-black" : "text-gray-500"}
                      />
                    </FormCell>
                  </FormRow>
                </tbody>
              </FormTable>
            </div>

            {/* Seção 2: Riscos Identificados */}
            <div>
              <SectionHeader title="RISCOS IDENTIFICADOS" number="2" />
              <FormTable>
                <tbody>
                  <FormRow>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Queda de Altura/Mesmo Nível" 
                        id="queda"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Prensamento/Esmagamento" 
                        id="prensamento"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Choque Elétrico" 
                        id="eletrico"
                      />
                    </FormCell>
                  </FormRow>
                  <FormRow>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Queimaduras/Escaldamento" 
                        id="queimaduras"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Ergonômico" 
                        id="ergonomico"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <div className="flex flex-col">
                        <FormCheckbox 
                          label="Outros:" 
                          id="outros"
                        />
                        <FormInput 
                          placeholder={formState.riscos.outrosTexto || "Especifique"}
                          className={formState.riscos.outrosTexto ? "text-black mt-2" : "text-gray-500 mt-2"}
                        />
                      </div>
                    </FormCell>
                  </FormRow>
                </tbody>
              </FormTable>
            </div>

            {/* Seção 3: EPIs Necessários */}
            <div>
              <SectionHeader title="EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL" number="3" />
              <FormTable>
                <tbody>
                  <FormRow>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Capacete de Segurança" 
                        id="capacete"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Luvas de Proteção" 
                        id="luvas"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Óculos de Proteção" 
                        id="oculos"
                      />
                    </FormCell>
                  </FormRow>
                  <FormRow>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Protetor Auricular" 
                        id="protetor"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Calçado de Segurança" 
                        id="calcado"
                      />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormCheckbox 
                        label="Cinto de Segurança" 
                        id="cinto"
                      />
                    </FormCell>
                  </FormRow>
                  <FormRow>
                    <FormCell width="100%" span={3}>
                      <div className="flex flex-col">
                        <FormCheckbox 
                          label="Outros:" 
                          id="outros_epi"
                        />
                        <FormInput 
                          placeholder={formState.epi.outrosTexto || "Especifique"}
                          className={formState.epi.outrosTexto ? "text-black mt-2" : "text-gray-500 mt-2"}
                        />
                      </div>
                    </FormCell>
                  </FormRow>
                </tbody>
              </FormTable>
            </div>

            {/* Seção 4: Medidas de Controle */}
            <div>
              <SectionHeader title="MEDIDAS DE CONTROLE" number="4" />
              <FormTable>
                <tbody>
                  <FormRow>
                    <FormCell width="100%">
                      <div className="h-24">
                        <FormInput 
                          placeholder={formState.medidas || "Descreva as medidas preventivas para controlar os riscos identificados"}
                          className={formState.medidas ? "text-black" : "text-gray-500"}
                        />
                      </div>
                    </FormCell>
                  </FormRow>
                </tbody>
              </FormTable>
            </div>

            {/* Seção 5: Assinaturas */}
            <div>
              <SectionHeader title="APROVAÇÕES" number="5" />
              <FormTable>
                <tbody>
                  <FormRow>
                    <FormCell width="33.33%">
                      <FormSignatureField label="Responsável pela Atividade" />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormSignatureField label="Supervisor da Área" />
                    </FormCell>
                    <FormCell width="33.33%">
                      <FormSignatureField label="Técnico de Segurança" />
                    </FormCell>
                  </FormRow>
                </tbody>
              </FormTable>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button 
            onClick={() => navigate("/document-creator/analise-risco")} 
            className="bg-green-600 hover:bg-green-700"
          >
            Criar Documento Personalizado
          </Button>
        </div>

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Documento</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="documentTitle" className="block mb-2">Título do Documento</Label>
              <Input
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Digite um título para o documento"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDocument}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
