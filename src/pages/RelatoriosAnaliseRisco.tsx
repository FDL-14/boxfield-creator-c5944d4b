import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, Download, FileSpreadsheet, Filter } from "lucide-react";
import { getSavedForms } from "@/utils/formUtils";
import { exportToExcel, generatePDF } from "@/utils/pdfUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5722'];

const RelatoriosAnaliseRisco = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    activity: "",
    hasImages: false,
    sortBy: "date-desc",
  });
  const [reportRef, setReportRef] = useState(null);

  useEffect(() => {
    // Load saved forms
    const savedForms = getSavedForms("analise-risco");
    setForms(savedForms);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      // Date filter
      if (filters.dateFrom || filters.dateTo) {
        const formDate = new Date(form.date);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (formDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59);
          if (formDate > toDate) return false;
        }
      }
      
      // Activity filter
      if (filters.activity && !form.data.atividade.toLowerCase().includes(filters.activity.toLowerCase())) {
        return false;
      }
      
      // Has images filter
      if (filters.hasImages && (!form.data.imagens || form.data.imagens.length === 0)) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      } else if (filters.sortBy === "date-desc") {
        return new Date(b.date) - new Date(a.date);
      } else if (filters.sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (filters.sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [forms, filters]);

  // Data for charts
  const activityData = useMemo(() => {
    const activityCounts = {};
    filteredForms.forEach(form => {
      const activity = form.data.atividade || "Sem atividade";
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });
    
    return Object.entries(activityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 activities
  }, [filteredForms]);

  const dateData = useMemo(() => {
    const dateCounts = {};
    filteredForms.forEach(form => {
      // Format to YYYY-MM-DD
      const date = format(new Date(form.date), "yyyy-MM-dd");
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    return Object.entries(dateCounts)
      .map(([date, count]) => ({
        date: format(new Date(date), "dd/MM/yy"),
        count
      }))
      .sort((a, b) => {
        const dateA = parse(a.date, "dd/MM/yy", new Date());
        const dateB = parse(b.date, "dd/MM/yy", new Date());
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-7); // Last 7 days with data
  }, [filteredForms]);

  const riskData = useMemo(() => {
    // Extract all risks from forms
    const risks = [];
    
    filteredForms.forEach(form => {
      form.data.analiseRisco.forEach(risk => {
        if (risk.risco) {
          risks.push(risk.risco);
        }
      });
    });
    
    // Count risk occurrences
    const riskCounts = {};
    risks.forEach(risk => {
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;
    });
    
    return Object.entries(riskCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 risks
  }, [filteredForms]);

  const handleExportExcel = () => {
    // Prepare data for Excel
    const data = filteredForms.map(form => ({
      Nome: form.name,
      Atividade: form.data.atividade,
      'Data Criação': format(new Date(form.date), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      'Riscos': form.data.analiseRisco.filter(r => r.risco).map(r => r.risco).join(', '),
      'Imagens': form.data.imagens ? form.data.imagens.length : 0
    }));
    
    exportToExcel(data, "Relatorio_Analise_Risco");
  };

  const handlePrintReport = () => {
    if (reportRef) {
      generatePDF(reportRef, "Relatorio_Analise_Risco");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-4 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Relatórios de Análise de Risco</h1>
            <p className="text-gray-500">Visualize e exporte relatórios dos formulários de Análise de Risco</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/analise-risco")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity">Atividade</Label>
                <Input
                  id="activity"
                  type="text"
                  placeholder="Buscar por atividade"
                  value={filters.activity}
                  onChange={(e) => handleFilterChange("activity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortBy">Ordenar por</Label>
                <Select 
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Data (mais recente)</SelectItem>
                    <SelectItem value="date-asc">Data (mais antiga)</SelectItem>
                    <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="hasImages"
                  checked={filters.hasImages}
                  onCheckedChange={(checked) => handleFilterChange("hasImages", checked)}
                />
                <Label htmlFor="hasImages">Apenas com imagens</Label>
              </div>
              <div className="flex justify-end pt-6">
                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={() => setFilters({
                    dateFrom: "",
                    dateTo: "",
                    activity: "",
                    hasImages: false,
                    sortBy: "date-desc",
                  })}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Controls */}
        <div className="flex justify-end gap-2 mb-6">
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
            onClick={handlePrintReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Report Content */}
        <div
          ref={(ref) => setReportRef(ref)}
          className="space-y-6 bg-white p-6 rounded-lg shadow-sm"
        >
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Formulários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{filteredForms.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Análises com Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {filteredForms.filter(form => form.data.imagens && form.data.imagens.length > 0).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Riscos Identificados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{riskData.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Principais Atividades</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {activityData.length > 0 ? (
                  <ChartContainer 
                    config={{
                      activity1: { color: "#0088FE" },
                      activity2: { color: "#00C49F" },
                      activity3: { color: "#FFBB28" },
                      activity4: { color: "#FF8042" },
                      activity5: { color: "#8884d8" },
                    }}
                  >
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => entry.name}
                      >
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Formulários por Data</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {dateData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dateData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Formulários" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Principais Riscos Identificados</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {riskData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={riskData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="#FF8042" name="Ocorrências" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Formulários ({filteredForms.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredForms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 border">Nome</th>
                        <th className="text-left p-2 border">Atividade</th>
                        <th className="text-left p-2 border">Data</th>
                        <th className="text-center p-2 border">Riscos</th>
                        <th className="text-center p-2 border">Imagens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForms.map((form) => (
                        <tr key={form.id} className="hover:bg-gray-50">
                          <td className="p-2 border">{form.name}</td>
                          <td className="p-2 border">{form.data.atividade || "—"}</td>
                          <td className="p-2 border">
                            {format(new Date(form.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </td>
                          <td className="p-2 border text-center">
                            {form.data.analiseRisco.filter(r => r.risco).length}
                          </td>
                          <td className="p-2 border text-center">
                            {form.data.imagens ? form.data.imagens.length : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Nenhum formulário encontrado. Tente ajustar os filtros.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosAnaliseRisco;
