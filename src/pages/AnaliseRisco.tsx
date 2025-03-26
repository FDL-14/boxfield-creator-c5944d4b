import React, { useState, useRef } from "react";
import { ArrowLeft, Save, Printer, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import { generatePDF } from "@/utils/pdfUtils";

export default function AnaliseRisco() {
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState("Análise Preliminar de Risco");
  const [documentData, setDocumentData] = useState({
    jobDescription: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    responsible: "",
    team: [
      { id: 1, name: "", role: "" }
    ],
    risks: [
      { id: 1, description: "", severity: "medium", mitigation: "" }
    ],
    equipment: [
      { id: 1, name: "", condition: "good" }
    ],
    approvals: [
      { id: 1, name: "", role: "", approved: false }
    ]
  });
  const formRef = useRef(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => {
      toast({
        title: "Documento impresso",
        description: "O documento foi enviado para impressão"
      });
    },
  });

  const handleExportPDF = async () => {
    if (!formRef.current) return;
    
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

  const handleSave = () => {
    toast({
      title: "Documento salvo",
      description: "O documento foi salvo com sucesso"
    });
  };

  const addItem = (type) => {
    const newData = { ...documentData };
    
    if (type === "team") {
      const newId = newData.team.length > 0 ? Math.max(...newData.team.map(t => t.id)) + 1 : 1;
      newData.team.push({ id: newId, name: "", role: "" });
    } else if (type === "risks") {
      const newId = newData.risks.length > 0 ? Math.max(...newData.risks.map(r => r.id)) + 1 : 1;
      newData.risks.push({ id: newId, description: "", severity: "medium", mitigation: "" });
    } else if (type === "equipment") {
      const newId = newData.equipment.length > 0 ? Math.max(...newData.equipment.map(e => e.id)) + 1 : 1;
      newData.equipment.push({ id: newId, name: "", condition: "good" });
    } else if (type === "approvals") {
      const newId = newData.approvals.length > 0 ? Math.max(...newData.approvals.map(a => a.id)) + 1 : 1;
      newData.approvals.push({ id: newId, name: "", role: "", approved: false });
    }
    
    setDocumentData(newData);
  };

  const handlePrintClick = () => {
    if (handlePrint) {
      handlePrint();
    }
  };

  const removeItem = (type, id) => {
    const newData = { ...documentData };
    
    if (type === "team" && newData.team.length > 1) {
      newData.team = newData.team.filter(item => item.id !== id);
    } else if (type === "risks" && newData.risks.length > 1) {
      newData.risks = newData.risks.filter(item => item.id !== id);
    } else if (type === "equipment" && newData.equipment.length > 1) {
      newData.equipment = newData.equipment.filter(item => item.id !== id);
    } else if (type === "approvals" && newData.approvals.length > 1) {
      newData.approvals = newData.approvals.filter(item => item.id !== id);
    }
    
    setDocumentData(newData);
  };

  const updateValue = (type, id, field, value) => {
    const newData = { ...documentData };
    
    if (type === "team") {
      const index = newData.team.findIndex(item => item.id === id);
      if (index !== -1) {
        newData.team[index][field] = value;
      }
    } else if (type === "risks") {
      const index = newData.risks.findIndex(item => item.id === id);
      if (index !== -1) {
        newData.risks[index][field] = value;
      }
    } else if (type === "equipment") {
      const index = newData.equipment.findIndex(item => item.id === id);
      if (index !== -1) {
        newData.equipment[index][field] = value;
      }
    } else if (type === "approvals") {
      const index = newData.approvals.findIndex(item => item.id === id);
      if (index !== -1) {
        newData.approvals[index][field] = value;
      }
    } else {
      newData[type] = value;
    }
    
    setDocumentData(newData);
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
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Análise de Risco</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Preencha os campos do documento e salve ou exporte
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button
              onClick={handlePrintClick}
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

        <div>
          <Tabs defaultValue="form">
            <TabsList className="mb-6">
              <TabsTrigger value="form">Formulário</TabsTrigger>
              <TabsTrigger value="preview">Visualização</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="documentTitle">Título do Documento</Label>
                      <Input 
                        id="documentTitle" 
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jobDescription">Descrição do Trabalho</Label>
                        <Input 
                          id="jobDescription" 
                          value={documentData.jobDescription}
                          onChange={(e) => updateValue('jobDescription', null, null, e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Local</Label>
                        <Input 
                          id="location" 
                          value={documentData.location}
                          onChange={(e) => updateValue('location', null, null, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Data</Label>
                        <Input 
                          id="date" 
                          type="date" 
                          value={documentData.date}
                          onChange={(e) => updateValue('date', null, null, e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="responsible">Responsável</Label>
                        <Input 
                          id="responsible" 
                          value={documentData.responsible}
                          onChange={(e) => updateValue('responsible', null, null, e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Equipe</CardTitle>
                    <Button 
                      size="sm" 
                      onClick={() => addItem('team')}
                    >
                      Adicionar Membro
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {documentData.team.map((member, index) => (
                        <div key={member.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pb-2 border-b">
                          <div>
                            <Label htmlFor={`member-name-${member.id}`}>Nome</Label>
                            <Input 
                              id={`member-name-${member.id}`} 
                              value={member.name}
                              onChange={(e) => updateValue('team', member.id, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`member-role-${member.id}`}>Função</Label>
                            <Input 
                              id={`member-role-${member.id}`} 
                              value={member.role}
                              onChange={(e) => updateValue('team', member.id, 'role', e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end">
                            {documentData.team.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => removeItem('team', member.id)}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Riscos Identificados</CardTitle>
                    <Button 
                      size="sm" 
                      onClick={() => addItem('risks')}
                    >
                      Adicionar Risco
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {documentData.risks.map((risk) => (
                        <div key={risk.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pb-4 border-b">
                          <div className="md:col-span-3">
                            <Label htmlFor={`risk-description-${risk.id}`}>Descrição do Risco</Label>
                            <Input 
                              id={`risk-description-${risk.id}`} 
                              value={risk.description}
                              onChange={(e) => updateValue('risks', risk.id, 'description', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`risk-severity-${risk.id}`}>Severidade</Label>
                            <select 
                              id={`risk-severity-${risk.id}`} 
                              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                              value={risk.severity}
                              onChange={(e) => updateValue('risks', risk.id, 'severity', e.target.value)}
                            >
                              <option value="low">Baixa</option>
                              <option value="medium">Média</option>
                              <option value="high">Alta</option>
                              <option value="critical">Crítica</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`risk-mitigation-${risk.id}`}>Medidas de Controle</Label>
                            <Input 
                              id={`risk-mitigation-${risk.id}`} 
                              value={risk.mitigation}
                              onChange={(e) => updateValue('risks', risk.id, 'mitigation', e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end md:col-span-3">
                            {documentData.risks.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => removeItem('risks', risk.id)}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="preview">
              <div 
                ref={printRef} 
                className="bg-white border rounded-md shadow-sm p-8"
              >
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h1 className="text-2xl font-bold text-blue-800">{documentTitle}</h1>
                  <Badge variant="outline" className="text-xs">Rev. 1</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Descrição do Trabalho</p>
                    <p className="font-medium">{documentData.jobDescription || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Local</p>
                    <p className="font-medium">{documentData.location || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-medium">
                      {documentData.date ? new Date(documentData.date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Responsável</p>
                    <p className="font-medium">{documentData.responsible || "N/A"}</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Equipe</h2>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Função
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {documentData.team.map((member) => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {member.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {member.role || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Riscos Identificados</h2>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Severidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Medidas de Controle
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {documentData.risks.map((risk) => (
                          <tr key={risk.id}>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {risk.description || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={
                                risk.severity === 'low' ? 'bg-green-100 text-green-800' :
                                risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                risk.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {risk.severity === 'low' ? 'Baixa' :
                                risk.severity === 'medium' ? 'Média' :
                                risk.severity === 'high' ? 'Alta' :
                                'Crítica'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {risk.mitigation || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
