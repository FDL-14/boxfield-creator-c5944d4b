
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

const PermissaoTrabalho = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-4 px-4 max-w-6xl">
        <div className="bg-white shadow-md">
          {/* Cabeçalho do Formulário */}
          <FormHeader 
            title="PERMISSÃO PARA TRABALHO" 
            number="0009001" 
            revision="08" 
          />

          {/* Tipo de Serviço */}
          <div className="p-2 border-b border-gray-300 flex justify-center items-center gap-10">
            <div className="flex items-center gap-2">
              <span className="font-bold">SERVIÇO A QUENTE</span>
              <div className="border border-black w-5 h-5"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">SERVIÇO A FRIO</span>
              <div className="border border-black w-5 h-5"></div>
            </div>
          </div>

          {/* Informações Iniciais */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">1. UNIDADE / ÁREA</div>
              <FormInput />
            </div>
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">2. DATA E HORA DA EMISSÃO</div>
              <FormInput />
            </div>
            <div className="p-2">
              <div className="font-bold mb-1">3. Nº OS</div>
              <FormInput />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">4. TURNO</div>
              <FormInput />
            </div>
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">5. Nº DE PESSOAS</div>
              <FormInput />
            </div>
            <div className="p-2">
              <div className="font-bold mb-1">6. Nº DE PESSOAS AUTORIZADAS</div>
              <FormInput />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">6. EMPRESA EXECUTANTE</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="border border-black w-4 h-4"></div>
                  <span>atvos</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="border border-black w-4 h-4"></div>
                  <span>OUTRA:</span>
                  <FormInput className="w-32 inline-block ml-2" />
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="font-bold mb-1">7. NOME DO EMITENTE EXECUTANTE E MATRÍCULA</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-sm">NOME:</span>
                  <FormInput />
                </div>
                <div>
                  <span className="text-sm">MATRÍCULA:</span>
                  <FormInput />
                </div>
              </div>
            </div>
          </div>

          {/* Descrição da Atividade */}
          <div className="p-2 border-b border-gray-300">
            <SectionHeader title="DESCRIÇÃO DA ATIVIDADE E LOCAL" number="8" />
            <div className="mt-2 min-h-[60px] border border-gray-300 p-2"></div>
          </div>

          {/* Ferramentas */}
          <div className="p-2 border-b border-gray-300">
            <SectionHeader title="FERRAMENTAS QUE SERÃO UTILIZADAS NA ATIVIDADE" number="9" />
            <div className="mt-2 min-h-[60px] border border-gray-300 p-2"></div>
          </div>

          {/* Avaliação Física */}
          <div className="p-2 border-b border-gray-300">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <SectionHeader title="AVALIAÇÃO FÍSICA DO EQUIPAMENTO OU LINHA" number="9" />
              </div>
              <div className="flex items-center gap-2 bg-orange-500 text-white p-1">
                <span>S</span>
                <div className="border border-white w-4 h-4"></div>
                <span>N</span>
                <div className="border border-white w-4 h-4"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <FormCheckbox label="Drenado/isento de líquidos?" id="drenado" />
                <FormCheckbox label="Lavado / Limpo?" id="lavado" />
                <FormCheckbox label="Vaporizado?" id="vaporizado" />
                <FormCheckbox label="Descontaminado?" id="descontaminado" />
                <FormCheckbox label="Fora de operação?" id="fora-operacao" />
                <FormCheckbox label="Despressurizado?" id="despressurizado" />
                <FormCheckbox label="Cabos desconectados?" id="cabos-desconectados" />
              </div>
              <div>
                <FormCheckbox label="Isolado do processo?" id="isolado-processo" />
                <FormCheckbox label="Com drenos abertos?" id="drenos-abertos" />
                <FormCheckbox label="Válvulas bloqueadas?" id="valvulas-bloqueadas" />
                <FormCheckbox label="Raqueteado?" id="raqueteado" />
                <FormCheckbox label="Neutralizado?" id="neutralizado" />
                <FormCheckbox label="Etiquetado?" id="etiquetado" />
                <FormCheckbox label="Motor e bomba desacoplados?" id="motor-bomba" />
              </div>
              <div>
                <FormCheckbox label="Desenergizado?" id="desenergizado" />
                <FormCheckbox label="Etiquetado?" id="etiquetado-2" />
                <FormCheckbox label="Teste zero realizado?" id="teste-zero" />
                <FormCheckbox label="Bloqueado com cadeado?" id="bloqueado" />
              </div>
            </div>
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

export default PermissaoTrabalho;
