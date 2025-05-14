import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, Download, FileSpreadsheet, Filter } from "lucide-react";
import { getSavedForms } from "@/utils/formUtils";
import { exportToExcel, generatePDF } from "@/utils/pdfUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Label } from "@/components/ui/label";

interface FormData {
  id: number;
  name: string;
  date: string;
  data: {
    atividade: string;
    local: string;
    departamento: string;
    responsavel: string;
    data: string;
    riscos: {
      queda: boolean;
      prensamento: boolean;
      eletrico: boolean;
      queimaduras: boolean;
      ergonomico: boolean;
      outros: boolean;
      outrosTexto: string;
    };
    epi: {
      capacete: boolean;
      luvas: boolean;
      oculos: boolean;
      protetor: boolean;
      calcado: boolean;
      cinto: boolean;
      outros: boolean;
      outrosTexto: string;
    };
    medidas: string;
  };
}

interface ChartData {
  name: string;
  value: number;
}

export default function RelatoriosAnaliseRisco() {
  const navigate = useNavigate();
  const [savedForms, setSavedForms] = useState<FormData[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormData[]>([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    local: "",
    departamento: "",
    riscos: {
      queda: false,
      prensamento: false,
      eletrico: false,
      queimaduras: false,
      ergonomico: false,
      outros: false
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const forms = getSavedForms("analise-risco");
    console.log("Loaded forms:", forms);
    setSavedForms(forms);
    setFilteredForms(forms);
  }, []);

  useEffect(() => {
    if (savedForms.length === 0) return;
    
    let filtered = [...savedForms];
    
    if (filters.startDate) {
      filtered = filtered.filter(form => {
        const formDate = new Date(form.date);
        const startDate = new Date(filters.startDate);
        return formDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(form => {
        const formDate = new Date(form.date);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59);
        return formDate <= endDate;
      });
    }
    
    if (filters.local) {
      filtered = filtered.filter(form => 
        form.data.local.toLowerCase().includes(filters.local.toLowerCase())
      );
    }
    
    if (filters.departamento) {
      filtered = filtered.filter(form => 
        form.data.departamento.toLowerCase().includes(filters.departamento.toLowerCase())
      );
    }
    
    const riscosKeys = Object.keys(filters.riscos) as Array<keyof typeof filters.riscos>;
    const riscosAtivos = riscosKeys.filter(risco => filters.riscos[risco]);
    
    if (riscosAtivos.length > 0) {
      filtered = filtered.filter(form => {
        return riscosAtivos.some(risco => {
          if (risco === 'outros') {
            return form.data.riscos.outros;
          }
          return form.data.riscos[risco as keyof typeof form.data.riscos];
        });
      });
    }
    
    setFilteredForms(filtered);
  }, [filters, savedForms]);

  const riskFrequencyData = useMemo(() => {
    const riskCounts: Record<string, number> = {
      'Queda': 0,
      'Prensamento': 0,
      'Choque Elétrico': 0,
      'Queimaduras': 0,
      'Ergonômico': 0,
      'Outros': 0
    };
    
    filteredForms.forEach(form => {
      if (form.data.riscos.queda) riskCounts['Queda']++;
      if (form.data.riscos.prensamento) riskCounts['Prensamento']++;
      if (form.data.riscos.eletrico) riskCounts['Choque Elétrico']++;
      if (form.data.riscos.queimaduras) riskCounts['Queimaduras']++;
      if (form.data.riscos.ergonomico) riskCounts['Ergonômico']++;
      if (form.data.riscos.outros) riskCounts['Outros']++;
    });
    
    return Object.entries(riskCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredForms]);

  const activityByLocationData = useMemo(() => {
    const locationCounts: Record<string, number> = {};
    
    filteredForms.forEach(form => {
      const local = form.data.local || 'Não especificado';
      locationCounts[local] = (locationCounts[local] || 0) + 1;
    });
    
    return Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredForms]);

  const topActivitiesData = useMemo(() => {
    const activityCounts: Record<string, number> = {};
    
    filteredForms.forEach(form => {
      const activity = form.data.atividade || 'Não especificado';
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });
    
    return Object.entries(activityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredForms]);

  const departmentData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    
    filteredForms.forEach(form => {
      const dept = form.data.departamento || 'Não especificado';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    return Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredForms]);

  const epiFrequencyData = useMemo(() => {
    const epiCounts: Record<string, number> = {
      'Capacete': 0,
      'Luvas': 0,
      'Óculos': 0,
      'Protetor Auricular': 0,
      'Calçado de Segurança': 0,
      'Cinto de Segurança': 0,
      'Outros': 0
    };
    
    filteredForms.forEach(form => {
      if (form.data.epi.capacete) epiCounts['Capacete']++;
      if (form.data.epi.luvas) epiCounts['Luvas']++;
      if (form.data.epi.oculos) epiCounts['Óculos']++;
      if (form.data.epi.protetor) epiCounts['Protetor Auricular']++;
      if (form.data.epi.calcado) epiCounts['Calçado de Segurança']++;
      if (form.data.epi.cinto) epiCounts['Cinto de Segurança']++;
      if (form.data.epi.outros) epiCounts['Outros']++;
    });
    
    return Object.entries(epiCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredForms]);

  const handleExportExcel = () => {
    const dataToExport = filteredForms.map(form => ({
      Nome: form.name,
      Data: new Date(form.date).toLocaleDateString(),
      Atividade: form.data.atividade,
      Local: form.data.local,
      Departamento: form.data.departamento,
      Responsavel: form.data.responsavel,
      'Risco: Queda': form.data.riscos.queda ? 'Sim' : 'Não',
      'Risco: Prensamento': form.data.riscos.prensamento ? 'Sim' : 'Não',
      'Risco: Eletrico': form.data.riscos.eletrico ? 'Sim' : 'Não',
      'Risco: Queimaduras': form.data.riscos.queimaduras ? 'Sim' : 'Não',
      'Risco: Ergonômico': form.data.riscos.ergonomico ? 'Sim' : 'Não',
      'Risco: Outros': form.data.riscos.outros ? form.data.riscos.outrosTexto : 'Não',
      Medidas: form.data.medidas
    }));
    
    exportToExcel(dataToExport, "relatorio-analise-risco");
  };

  const handleExportPDF = async () => {
    const reportElement = document.getElementById('report-container');
    const success = await generatePDF(reportElement, "relatorio-analise-risco");
    
    if (success) {
      console.log("PDF generated successfully");
    } else {
      console.error("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Relatórios de Análise de Risco</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Visualize e analise dados de {filteredForms.length} documentos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 animate-slide-down">
            <CardHeader>
              <CardTitle className="text-xl">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="startDate" className="block mb-2">Data Inicial</Label>
                  <Input 
                    id="startDate"
                    type="date" 
                    value={filters.startDate}
                    onChange={e => setFilters({...filters, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="block mb-2">Data Final</Label>
                  <Input 
                    id="endDate"
                    type="date" 
                    value={filters.endDate}
                    onChange={e => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="local" className="block mb-2">Local</Label>
                  <Input 
                    id="local"
                    placeholder="Filtrar por local" 
                    value={filters.local}
                    onChange={e => setFilters({...filters, local: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="departamento" className="block mb-2">Departamento</Label>
                  <Input 
                    id="departamento"
                    placeholder="Filtrar por departamento" 
                    value={filters.departamento}
                    onChange={e => setFilters({...filters, departamento: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label className="block mb-2">Riscos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="queda"
                      checked={filters.riscos.queda}
                      onCheckedChange={checked => setFilters({
                        ...filters, 
                        riscos: {...filters.riscos, queda: checked === true}
                      })}
                    />
                    <label htmlFor="queda" className="text-sm">Queda</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prensamento"
                      checked={filters.riscos.prensamento}
                      onCheckedChange={checked => setFilters({
                        ...filters, 
                        riscos: {...filters.riscos, prensamento: checked === true}
                      })}
                    />
                    <label htmlFor="prensamento" className="text-sm">Prensamento</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="eletrico"
                      checked={filters.riscos.eletrico}
                      onCheckedChange={checked => setFilters({
                        ...filters, 
                        riscos: {...filters.riscos, eletrico: checked === true}
                      })}
                    />
                    <label htmlFor="eletrico" className="text-sm">Elétrico</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="queimaduras"
                      checked={filters.riscos.queimaduras}
                      onCheckedChange={checked => setFilters({
                        ...filters, 
                        riscos: {...filters.riscos, queimaduras: checked === true}
                      })}
                    />
                    <label htmlFor="queimaduras" className="text-sm">Queimaduras</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="ergonomico"
                      checked={filters.riscos.ergonomico}
                      onCheckedChange={checked => setFilters({
                        ...filters, 
                        riscos: {...filters.riscos, ergonomico: checked === true}
                      })}
                    />
                    <label htmlFor="ergonomico" className="text-sm">Ergonômico</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="outros"
                      checked={filters.riscos.outros}
                      onCheckedChange={checked => setFilters({
                        ...filters, 
                        riscos: {...filters.riscos, outros: checked === true}
                      })}
                    />
                    <label htmlFor="outros" className="text-sm">Outros</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div id="report-container" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Total de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-blue-600">{filteredForms.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Departamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-green-600">
                  {new Set(filteredForms.map(f => f.data.departamento)).size}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Locais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-orange-600">
                  {new Set(filteredForms.map(f => f.data.local)).size}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Distribuição de Riscos</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskFrequencyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartContainer config={{}}>
                              <ChartTooltipContent>
                                <div className="flex flex-col">
                                  <span className="font-medium">{payload[0].name}: {payload[0].value}</span>
                                </div>
                              </ChartTooltipContent>
                            </ChartContainer>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Distribuição por Local</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityByLocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {activityByLocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartContainer config={{}}>
                              <ChartTooltipContent>
                                <div className="flex flex-col">
                                  <span className="font-medium">{payload[0].name}: {payload[0].value}</span>
                                </div>
                              </ChartTooltipContent>
                            </ChartContainer>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Principais Atividades</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topActivitiesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartContainer config={{}}>
                              <ChartTooltipContent>
                                <div className="flex flex-col">
                                  <span className="font-medium">{payload[0].name}: {payload[0].value}</span>
                                </div>
                              </ChartTooltipContent>
                            </ChartContainer>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">EPIs Utilizados</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={epiFrequencyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartContainer config={{}}>
                              <ChartTooltipContent>
                                <div className="flex flex-col">
                                  <span className="font-medium">{payload[0].name}: {payload[0].value}</span>
                                </div>
                              </ChartTooltipContent>
                            </ChartContainer>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {filteredForms.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Lista de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredForms.map(form => (
                        <tr key={form.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{form.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(form.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.data.atividade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.data.local}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.data.departamento}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
