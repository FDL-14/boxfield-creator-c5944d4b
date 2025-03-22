
import React from "react";
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
            <FormInput />
          </div>

          {/* Seção 20 - Análise de Risco Complementar */}
          <div className="mb-4">
            <SectionHeader title="ANÁLISE DE RISCO COMPLEMENTAR" number="20" />
            <FormTable>
              <thead>
                <FormRow header>
                  <FormCell header width="60px" align="center">Nº ETAPA</FormCell>
                  <FormCell header>DESCRIÇÃO DA ETAPA</FormCell>
                  <FormCell header>RISCO/IMPACTO</FormCell>
                  <FormCell header>BARREIRAS/CONTROLE</FormCell>
                </FormRow>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(num => (
                  <FormRow key={num}>
                    <FormCell align="center">{String(num).padStart(2, '0')}</FormCell>
                    <FormCell><FormInput /></FormCell>
                    <FormCell><FormInput /></FormCell>
                    <FormCell><FormInput /></FormCell>
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
                  <FormCell header></FormCell>
                  <FormCell header align="center">1º DIA</FormCell>
                  <FormCell header align="center">2º DIA</FormCell>
                  <FormCell header align="center">3º DIA</FormCell>
                  <FormCell header align="center">4º DIA</FormCell>
                  <FormCell header align="center">5º DIA</FormCell>
                  <FormCell header align="center">6º DIA</FormCell>
                </FormRow>
              </thead>
              <tbody>
                {[
                  "Data:", 
                  "Hora:", 
                  "Assinatura Executante da PT:", 
                  "Assinatura Dono de Área:", 
                  "Assinatura SSMA:", 
                  "Revalidação do Bloqueio:", 
                  "Brigadista obrigatório:"
                ].map((label, idx) => (
                  <FormRow key={idx}>
                    <FormCell>{label}</FormCell>
                    <FormCell></FormCell>
                    <FormCell></FormCell>
                    <FormCell></FormCell>
                    <FormCell></FormCell>
                    <FormCell></FormCell>
                    <FormCell></FormCell>
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
