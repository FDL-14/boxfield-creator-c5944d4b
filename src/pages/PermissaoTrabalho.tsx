
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

const PermissaoTrabalho = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoServico: "", // "quente" ou "frio"
    unidadeArea: "",
    dataHoraEmissao: "",
    numeroOS: "",
    turno: "",
    numeroPessoas: "",
    numeroPessoasAutorizadas: "",
    empresaExecutante: "atvos", // "atvos" ou "outra"
    outraEmpresa: "",
    nomeEmitente: "",
    matriculaEmitente: "",
    descricaoAtividade: "",
    ferramentas: "",
    avaliacaoFisica: {
      drenado: false,
      lavado: false,
      vaporizado: false,
      descontaminado: false,
      foraOperacao: false,
      despressurizado: false,
      cabosDesconectados: false,
      isoladoProcesso: false,
      drenosAbertos: false,
      valvulasBloqueadas: false,
      raqueteado: false,
      neutralizado: false,
      etiquetado: false,
      motorBombaDesacoplados: false,
      desenergizado: false,
      etiquetado2: false,
      testeZero: false,
      bloqueadoCadeado: false
    }
  });

  const handleCheckboxChange = (field) => {
    setFormData({
      ...formData,
      avaliacaoFisica: {
        ...formData.avaliacaoFisica,
        [field]: !formData.avaliacaoFisica[field]
      }
    });
  };

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
              <div 
                className={`border border-black w-5 h-5 cursor-pointer ${formData.tipoServico === "quente" ? "bg-black" : ""}`}
                onClick={() => setFormData({...formData, tipoServico: "quente"})}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">SERVIÇO A FRIO</span>
              <div 
                className={`border border-black w-5 h-5 cursor-pointer ${formData.tipoServico === "frio" ? "bg-black" : ""}`}
                onClick={() => setFormData({...formData, tipoServico: "frio"})}
              ></div>
            </div>
          </div>

          {/* Informações Iniciais */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">1. UNIDADE / ÁREA</div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={formData.unidadeArea}
                onChange={(e) => setFormData({...formData, unidadeArea: e.target.value})}
              />
            </div>
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">2. DATA E HORA DA EMISSÃO</div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={formData.dataHoraEmissao}
                onChange={(e) => setFormData({...formData, dataHoraEmissao: e.target.value})}
              />
            </div>
            <div className="p-2">
              <div className="font-bold mb-1">3. Nº OS</div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={formData.numeroOS}
                onChange={(e) => setFormData({...formData, numeroOS: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">4. TURNO</div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={formData.turno}
                onChange={(e) => setFormData({...formData, turno: e.target.value})}
              />
            </div>
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">5. Nº DE PESSOAS</div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={formData.numeroPessoas}
                onChange={(e) => setFormData({...formData, numeroPessoas: e.target.value})}
              />
            </div>
            <div className="p-2">
              <div className="font-bold mb-1">6. Nº DE PESSOAS AUTORIZADAS</div>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={formData.numeroPessoasAutorizadas}
                onChange={(e) => setFormData({...formData, numeroPessoasAutorizadas: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <div className="font-bold mb-1">6. EMPRESA EXECUTANTE</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div 
                    className={`border border-black w-4 h-4 cursor-pointer ${formData.empresaExecutante === "atvos" ? "bg-black" : ""}`}
                    onClick={() => setFormData({...formData, empresaExecutante: "atvos"})}
                  ></div>
                  <span>atvos</span>
                </div>
                <div className="flex items-center gap-1">
                  <div 
                    className={`border border-black w-4 h-4 cursor-pointer ${formData.empresaExecutante === "outra" ? "bg-black" : ""}`}
                    onClick={() => setFormData({...formData, empresaExecutante: "outra"})}
                  ></div>
                  <span>OUTRA:</span>
                  <input 
                    type="text" 
                    className="w-32 p-1 border rounded ml-2" 
                    value={formData.outraEmpresa}
                    onChange={(e) => setFormData({...formData, outraEmpresa: e.target.value})}
                    disabled={formData.empresaExecutante !== "outra"}
                  />
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="font-bold mb-1">7. NOME DO EMITENTE EXECUTANTE E MATRÍCULA</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-sm">NOME:</span>
                  <input 
                    type="text" 
                    className="w-full p-1 border rounded" 
                    value={formData.nomeEmitente}
                    onChange={(e) => setFormData({...formData, nomeEmitente: e.target.value})}
                  />
                </div>
                <div>
                  <span className="text-sm">MATRÍCULA:</span>
                  <input 
                    type="text" 
                    className="w-full p-1 border rounded" 
                    value={formData.matriculaEmitente}
                    onChange={(e) => setFormData({...formData, matriculaEmitente: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Descrição da Atividade */}
          <div className="p-2 border-b border-gray-300">
            <SectionHeader title="DESCRIÇÃO DA ATIVIDADE E LOCAL" number="8" />
            <textarea 
              className="mt-2 min-h-[60px] border border-gray-300 p-2 w-full rounded"
              value={formData.descricaoAtividade}
              onChange={(e) => setFormData({...formData, descricaoAtividade: e.target.value})}
            ></textarea>
          </div>

          {/* Ferramentas */}
          <div className="p-2 border-b border-gray-300">
            <SectionHeader title="FERRAMENTAS QUE SERÃO UTILIZADAS NA ATIVIDADE" number="9" />
            <textarea 
              className="mt-2 min-h-[60px] border border-gray-300 p-2 w-full rounded"
              value={formData.ferramentas}
              onChange={(e) => setFormData({...formData, ferramentas: e.target.value})}
            ></textarea>
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
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="drenado" 
                    checked={formData.avaliacaoFisica.drenado}
                    onChange={() => handleCheckboxChange("drenado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="drenado">Drenado/isento de líquidos?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="lavado" 
                    checked={formData.avaliacaoFisica.lavado}
                    onChange={() => handleCheckboxChange("lavado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="lavado">Lavado / Limpo?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="vaporizado" 
                    checked={formData.avaliacaoFisica.vaporizado}
                    onChange={() => handleCheckboxChange("vaporizado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="vaporizado">Vaporizado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="descontaminado" 
                    checked={formData.avaliacaoFisica.descontaminado}
                    onChange={() => handleCheckboxChange("descontaminado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="descontaminado">Descontaminado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="foraOperacao" 
                    checked={formData.avaliacaoFisica.foraOperacao}
                    onChange={() => handleCheckboxChange("foraOperacao")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="foraOperacao">Fora de operação?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="despressurizado" 
                    checked={formData.avaliacaoFisica.despressurizado}
                    onChange={() => handleCheckboxChange("despressurizado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="despressurizado">Despressurizado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="cabosDesconectados" 
                    checked={formData.avaliacaoFisica.cabosDesconectados}
                    onChange={() => handleCheckboxChange("cabosDesconectados")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="cabosDesconectados">Cabos desconectados?</label>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="isoladoProcesso" 
                    checked={formData.avaliacaoFisica.isoladoProcesso}
                    onChange={() => handleCheckboxChange("isoladoProcesso")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isoladoProcesso">Isolado do processo?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="drenosAbertos" 
                    checked={formData.avaliacaoFisica.drenosAbertos}
                    onChange={() => handleCheckboxChange("drenosAbertos")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="drenosAbertos">Com drenos abertos?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="valvulasBloqueadas" 
                    checked={formData.avaliacaoFisica.valvulasBloqueadas}
                    onChange={() => handleCheckboxChange("valvulasBloqueadas")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="valvulasBloqueadas">Válvulas bloqueadas?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="raqueteado" 
                    checked={formData.avaliacaoFisica.raqueteado}
                    onChange={() => handleCheckboxChange("raqueteado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="raqueteado">Raqueteado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="neutralizado" 
                    checked={formData.avaliacaoFisica.neutralizado}
                    onChange={() => handleCheckboxChange("neutralizado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="neutralizado">Neutralizado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="etiquetado" 
                    checked={formData.avaliacaoFisica.etiquetado}
                    onChange={() => handleCheckboxChange("etiquetado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="etiquetado">Etiquetado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="motorBomba" 
                    checked={formData.avaliacaoFisica.motorBombaDesacoplados}
                    onChange={() => handleCheckboxChange("motorBombaDesacoplados")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="motorBomba">Motor e bomba desacoplados?</label>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="desenergizado" 
                    checked={formData.avaliacaoFisica.desenergizado}
                    onChange={() => handleCheckboxChange("desenergizado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="desenergizado">Desenergizado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="etiquetado2" 
                    checked={formData.avaliacaoFisica.etiquetado2}
                    onChange={() => handleCheckboxChange("etiquetado2")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="etiquetado2">Etiquetado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="testeZero" 
                    checked={formData.avaliacaoFisica.testeZero}
                    onChange={() => handleCheckboxChange("testeZero")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="testeZero">Teste zero realizado?</label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="bloqueado" 
                    checked={formData.avaliacaoFisica.bloqueadoCadeado}
                    onChange={() => handleCheckboxChange("bloqueadoCadeado")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="bloqueado">Bloqueado com cadeado?</label>
                </div>
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
