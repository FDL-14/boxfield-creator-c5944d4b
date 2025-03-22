
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Save } from "lucide-react";
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

const AnaliseRisco = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    atividade: "",
    analiseRisco: Array(5).fill({ etapa: "", risco: "", barreira: "" }),
    revalidacao: {
      data: Array(6).fill(""),
      hora: Array(6).fill(""),
      assinaturaExecutante: Array(6).fill(""),
      assinaturaDonoArea: Array(6).fill(""),
      assinaturaSSMA: Array(6).fill(""),
      revalidacaoBloqueio: Array(6).fill(""),
      brigadistaObrigatorio: Array(6).fill("")
    }
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

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-4 px-4 max-w-6xl">
        <div className="bg-white shadow-md">
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
                  <FormCell header width="60px" align="center">Nº ETAPA</FormCell>
                  <FormCell header width="30%" align="center">DESCRIÇÃO DA ETAPA</FormCell>
                  <FormCell header width="30%" align="center">RISCO/IMPACTO</FormCell>
                  <FormCell header width="30%" align="center">BARREIRAS/CONTROLE</FormCell>
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
                  <FormCell header width="25%"></FormCell>
                  <FormCell header width="12.5%" align="center">1º DIA</FormCell>
                  <FormCell header width="12.5%" align="center">2º DIA</FormCell>
                  <FormCell header width="12.5%" align="center">3º DIA</FormCell>
                  <FormCell header width="12.5%" align="center">4º DIA</FormCell>
                  <FormCell header width="12.5%" align="center">5º DIA</FormCell>
                  <FormCell header width="12.5%" align="center">6º DIA</FormCell>
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
                        <input 
                          type="text" 
                          className="w-full p-1 border rounded" 
                          value={formData.revalidacao[row.field][day]}
                          onChange={(e) => handleRevalidacaoChange(row.field, day, e.target.value)}
                        />
                      </FormCell>
                    ))}
                  </FormRow>
                ))}
              </tbody>
            </FormTable>
          </div>

          {/* Botões */}
          <div className="flex justify-between p-4 border-t border-gray-300">
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex gap-2 items-center"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button 
                className="flex gap-2 items-center bg-orange-600 hover:bg-orange-700"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnaliseRisco;
