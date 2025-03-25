
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Save, Download, FileImage } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  FormHeader, 
  SectionHeader, 
  FormTable, 
  FormRow, 
  FormCell,
  FormInput,
  FormSignatureField,
  FormCheckbox
} from "@/components/form-templates/FormStyles";
import { useReactToPrint } from "react-to-print";
import { generatePDF } from "@/utils/pdfUtils";
import { saveFormData } from "@/utils/formUtils";
import { useToast } from "@/components/ui/use-toast";

const AnaliseRisco = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const printRef = useRef(null);
  const [formData, setFormData] = useState({
    atividade: "",
    analiseRisco: Array(5).fill({ etapa: "", risco: "", barreira: "" }),
    revalidacao: {
      data: Array(6).fill(""),
      hora: Array(6).fill(""),
      assinaturaExecutante: Array(6).fill(""),
      assinaturaDonoArea: Array(6).fill(""),
      assinaturaSSMA: Array(6).fill(""),
      revalidacaoBloqueio: Array(6).fill(false),
      brigadistaObrigatorio: Array(6).fill(false)
    },
    imagens: []
  });

  const handleAnaliseRiscoChange = (index, field, value) => {
    const newAnaliseRisco = [...formData.analiseRisco];
    newAnaliseRisco[index] = { ...newAnaliseRisco[index], [field]: value };
    setFormData({ ...formData, analiseRisco: newAnaliseRisco });
  };

  const handleRevalidacaoChange = (field, index, value) => {
    const newRevalidacao = { ...formData.revalidacao };
    newRevalidacao[field][index] = value;
    setFormData({ ...formData, revalidacao: newRevalidacao });
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imagens: [...formData.imagens, { 
            id: Date.now(), 
            url: reader.result, 
            name: file.name 
          }]
        });
      };
      
      reader.readAsDataURL(file);
      toast({
        title: "Imagem adicionada",
        description: `${file.name} foi adicionada ao formulário`,
      });
    }
  };

  const removeImage = (id) => {
    setFormData({
      ...formData,
      imagens: formData.imagens.filter(img => img.id !== id)
    });
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Análise de Risco - ${formData.atividade || 'Nova'}`,
    onAfterPrint: () => toast({
      title: "Impressão concluída",
      description: "O documento foi enviado para impressão",
    }),
  });

  const handleSave = () => {
    const fileName = prompt("Digite um nome para salvar o formulário:", formData.atividade || "Nova Análise de Risco");
    if (fileName) {
      saveFormData('analise-risco', fileName, formData);
      toast({
        title: "Formulário salvo",
        description: `O formulário foi salvo como "${fileName}"`,
      });
    }
  };

  const handleExportPDF = () => {
    generatePDF(printRef.current, `Análise de Risco - ${formData.atividade || 'Nova'}`);
    toast({
      title: "PDF gerado",
      description: "O PDF foi gerado e baixado com sucesso",
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-4 px-4 max-w-6xl">
        <div className="bg-white shadow-md" ref={printRef}>
          {/* Cabeçalho do Formulário */}
          <FormHeader 
            title="ANÁLISE DE RISCO COMPLEMENTAR" 
            number="0009001" 
            revision="08" 
          />

          {/* Atividade */}
          <div className="p-2 border-b border-gray-300">
            <div className="font-bold mb-1">ATIVIDADE:</div>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              value={formData.atividade}
              onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
            />
          </div>

          {/* Seção 20 - Análise de Risco Complementar */}
          <div className="mb-4">
            <SectionHeader title="ANÁLISE DE RISCO COMPLEMENTAR" number="20" />
            <FormTable>
              <thead>
                <FormRow header>
                  <FormCell header width="60px" align="center">
                    Nº ETAPA
                  </FormCell>
                  <FormCell header width="30%" align="center">
                    DESCRIÇÃO DA ETAPA
                  </FormCell>
                  <FormCell header width="30%" align="center">
                    RISCO/IMPACTO
                  </FormCell>
                  <FormCell header width="30%" align="center">
                    BARREIRAS/CONTROLE
                  </FormCell>
                </FormRow>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((num, index) => (
                  <FormRow key={num}>
                    <FormCell width="60px" align="center">{String(num).padStart(2, '0')}</FormCell>
                    <FormCell width="30%">
                      <input 
                        type="text" 
                        className="w-full p-1 border rounded" 
                        value={formData.analiseRisco[index]?.etapa || ""}
                        onChange={(e) => handleAnaliseRiscoChange(index, 'etapa', e.target.value)}
                      />
                    </FormCell>
                    <FormCell width="30%">
                      <input 
                        type="text" 
                        className="w-full p-1 border rounded" 
                        value={formData.analiseRisco[index]?.risco || ""}
                        onChange={(e) => handleAnaliseRiscoChange(index, 'risco', e.target.value)}
                      />
                    </FormCell>
                    <FormCell width="30%">
                      <input 
                        type="text" 
                        className="w-full p-1 border rounded" 
                        value={formData.analiseRisco[index]?.barreira || ""}
                        onChange={(e) => handleAnaliseRiscoChange(index, 'barreira', e.target.value)}
                      />
                    </FormCell>
                  </FormRow>
                ))}
              </tbody>
            </FormTable>
          </div>

          {/* Seção 21 - Revalidação */}
          <div className="mb-4">
            <SectionHeader 
              title="Revalidação da Permissão de Trabalho - Somente caso mantenha o mesmo cenário, não alterando barreiras de controle e os riscos, e as mesmas pessoas envolvidas na atividade." 
              number="21" 
            />
            <FormTable>
              <thead>
                <FormRow header>
                  <FormCell header width="25%">
                    
                  </FormCell>
                  <FormCell header width="12.5%" align="center">
                    1º DIA
                  </FormCell>
                  <FormCell header width="12.5%" align="center">
                    2º DIA
                  </FormCell>
                  <FormCell header width="12.5%" align="center">
                    3º DIA
                  </FormCell>
                  <FormCell header width="12.5%" align="center">
                    4º DIA
                  </FormCell>
                  <FormCell header width="12.5%" align="center">
                    5º DIA
                  </FormCell>
                  <FormCell header width="12.5%" align="center">
                    6º DIA
                  </FormCell>
                </FormRow>
              </thead>
              <tbody>
                {[
                  { label: "Data:", field: "data" }, 
                  { label: "Hora:", field: "hora" }, 
                  { label: "Assinatura Executante da PT:", field: "assinaturaExecutante" }, 
                  { label: "Assinatura Dono de Área:", field: "assinaturaDonoArea" }, 
                  { label: "Assinatura SSMA:", field: "assinaturaSSMA" }, 
                  { label: "Revalidação do Bloqueio:", field: "revalidacaoBloqueio" }, 
                  { label: "Brigadista obrigatório:", field: "brigadistaObrigatorio" }
                ].map((row, idx) => (
                  <FormRow key={idx}>
                    <FormCell width="25%">{row.label}</FormCell>
                    {[0, 1, 2, 3, 4, 5].map((day) => (
                      <FormCell key={day} width="12.5%">
                        {row.field === "revalidacaoBloqueio" || row.field === "brigadistaObrigatorio" ? (
                          <input 
                            type="checkbox" 
                            checked={formData.revalidacao[row.field][day]}
                            onChange={(e) => handleRevalidacaoChange(row.field, day, e.target.checked)}
                            className="w-5 h-5"
                          />
                        ) : (
                          <input 
                            type="text" 
                            className="w-full p-1 border rounded" 
                            value={formData.revalidacao[row.field][day]}
                            onChange={(e) => handleRevalidacaoChange(row.field, day, e.target.value)}
                          />
                        )}
                      </FormCell>
                    ))}
                  </FormRow>
                ))}
              </tbody>
            </FormTable>
          </div>

          {/* Seção de Imagens */}
          <div className="mb-4">
            <SectionHeader title="IMAGENS E FOTOS" number="22" />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.imagens.map((imagem) => (
                <div key={imagem.id} className="border rounded-lg p-2 relative">
                  <img 
                    src={imagem.url} 
                    alt={imagem.name} 
                    className="w-full h-48 object-contain" 
                  />
                  <p className="mt-2 text-center text-sm">{imagem.name}</p>
                  <button 
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    onClick={() => removeImage(imagem.id)}
                    type="button"
                  >
                    X
                  </button>
                </div>
              ))}
              {formData.imagens.length === 0 && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed p-8 rounded-lg">
                  <FileImage className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">Nenhuma imagem adicionada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-wrap justify-between p-4 gap-2 border-t border-gray-300 bg-white shadow-md mt-4">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="flex gap-2 items-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              className="flex gap-2 items-center"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = handleImageUpload;
                input.click();
              }}
            >
              <FileImage className="h-4 w-4" />
              Adicionar Imagem
            </Button>
            <Button 
              variant="outline"
              className="flex gap-2 items-center"
              onClick={handleExportPDF}
            >
              <Download className="h-4 w-4" />
              Gerar PDF
            </Button>
            <Button 
              variant="outline"
              className="flex gap-2 items-center"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button 
              className="flex gap-2 items-center bg-orange-600 hover:bg-orange-700"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Botão para Relatórios */}
        <Button
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/relatorios/analise-risco")}
        >
          Ver Relatórios
        </Button>
      </div>
    </div>
  );
};

export default AnaliseRisco;
