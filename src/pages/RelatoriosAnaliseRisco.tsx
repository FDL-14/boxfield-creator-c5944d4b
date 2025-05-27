
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, Download, FileSpreadsheet, Filter } from "lucide-react";
import { DocumentService } from "@/services/documentService";
import { exportToExcel, generatePDF } from "@/utils/pdfUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DocumentData {
  id: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  data: any;
  is_template: boolean;
}

interface ChartData {
  name: string;
  value: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function RelatoriosAnaliseRisco() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentData[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    documentType: "",
    createdBy: "",
    isTemplate: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Buscar documentos reais do banco de dados
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        
        // Buscar documentos do Supabase
        const { data: documentsData, error: documentsError } = await supabase
          .from('document_templates')
          .select(`
            id,
            title,
            type,
            created_at,
            updated_at,
            created_by,
            data,
            is_template,
            is_deleted
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (documentsError) {
          console.error("Erro ao buscar documentos:", documentsError);
          toast({
            title: "Erro ao carregar documentos",
            description: "Não foi possível carregar os documentos do banco de dados",
            variant: "destructive"
          });
          return;
        }

        // Buscar informações dos usuários
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, email');

        if (usersError) {
          console.error("Erro ao buscar usuários:", usersError);
        }

        setDocuments(documentsData || []);
        setUsers(usersData || []);
        setFilteredDocuments(documentsData || []);
        
        console.log(`${documentsData?.length || 0} documentos carregados do banco de dados`);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do banco",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    if (documents.length === 0) return;
    
    let filtered = [...documents];
    
    if (filters.startDate) {
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.created_at);
        const startDate = new Date(filters.startDate);
        return docDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59);
        return docDate <= endDate;
      });
    }
    
    if (filters.documentType) {
      filtered = filtered.filter(doc => 
        doc.type.toLowerCase().includes(filters.documentType.toLowerCase())
      );
    }
    
    if (filters.createdBy) {
      filtered = filtered.filter(doc => doc.created_by === filters.createdBy);
    }
    
    if (filters.isTemplate !== "") {
      const isTemplate = filters.isTemplate === "true";
      filtered = filtered.filter(doc => doc.is_template === isTemplate);
    }
    
    setFilteredDocuments(filtered);
  }, [filters, documents]);

  // Dados para gráficos baseados em documentos reais
  const documentTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    filteredDocuments.forEach(doc => {
      const type = doc.type || 'Sem tipo';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredDocuments]);

  const documentsPerUserData = useMemo(() => {
    const userCounts: Record<string, number> = {};
    
    filteredDocuments.forEach(doc => {
      const user = users.find(u => u.id === doc.created_by);
      const userName = user ? user.name : 'Usuário desconhecido';
      userCounts[userName] = (userCounts[userName] || 0) + 1;
    });
    
    return Object.entries(userCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredDocuments, users]);

  const documentsPerMonthData = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    
    filteredDocuments.forEach(doc => {
      const date = new Date(doc.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    
    return Object.entries(monthCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-12); // Últimos 12 meses
  }, [filteredDocuments]);

  const templateVsDocumentData = useMemo(() => {
    const templateCount = filteredDocuments.filter(doc => doc.is_template).length;
    const documentCount = filteredDocuments.filter(doc => !doc.is_template).length;
    
    return [
      { name: 'Modelos', value: templateCount },
      { name: 'Documentos', value: documentCount }
    ].filter(item => item.value > 0);
  }, [filteredDocuments]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário desconhecido';
  };

  const handleExportExcel = () => {
    const dataToExport = filteredDocuments.map(doc => ({
      'ID': doc.id,
      'Título': doc.title,
      'Tipo': doc.type,
      'Criado por': getUserName(doc.created_by),
      'Data de Criação': new Date(doc.created_at).toLocaleDateString('pt-BR'),
      'Última Atualização': new Date(doc.updated_at).toLocaleDateString('pt-BR'),
      'É Modelo': doc.is_template ? 'Sim' : 'Não'
    }));
    
    exportToExcel(dataToExport, "relatorio-documentos");
    
    toast({
      title: "Excel exportado",
      description: "O relatório foi exportado para Excel com sucesso"
    });
  };

  const handleExportPDF = async () => {
    const reportElement = document.getElementById('report-container');
    const success = await generatePDF(reportElement, "relatorio-documentos");
    
    if (success) {
      toast({
        title: "PDF exportado",
        description: "O relatório foi exportado para PDF com sucesso"
      });
    } else {
      toast({
        title: "Erro ao exportar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados dos documentos...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Relatórios de Documentos</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Visualize e analise dados de {filteredDocuments.length} documentos do banco de dados
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <Label htmlFor="documentType" className="block mb-2">Tipo de Documento</Label>
                  <Input 
                    id="documentType"
                    placeholder="Filtrar por tipo" 
                    value={filters.documentType}
                    onChange={e => setFilters({...filters, documentType: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="createdBy" className="block mb-2">Criado por</Label>
                  <Select 
                    value={filters.createdBy}
                    onValueChange={value => setFilters({...filters, createdBy: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os usuários</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isTemplate" className="block mb-2">Tipo</Label>
                  <Select 
                    value={filters.isTemplate}
                    onValueChange={value => setFilters({...filters, isTemplate: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="false">Documentos</SelectItem>
                      <SelectItem value="true">Modelos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div id="report-container" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Total de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-blue-600">{filteredDocuments.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Tipos de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-green-600">
                  {new Set(filteredDocuments.map(d => d.type)).size}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-orange-600">
                  {new Set(filteredDocuments.map(d => d.created_by)).size}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-center">Modelos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-center text-purple-600">
                  {filteredDocuments.filter(d => d.is_template).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Documentos por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={documentTypeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Documentos por Usuário</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={documentsPerUserData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Documentos por Mês</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={documentsPerMonthData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Modelos vs Documentos</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={templateVsDocumentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {templateVsDocumentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {filteredDocuments.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Lista de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado por</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDocuments.slice(0, 50).map(doc => (
                        <tr key={doc.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getUserName(doc.created_by)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              doc.is_template 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.is_template ? 'Modelo' : 'Documento'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredDocuments.length > 50 && (
                    <p className="text-sm text-gray-500 mt-4 text-center">
                      Mostrando primeiros 50 documentos de {filteredDocuments.length} total
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredDocuments.length === 0 && !loading && (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg">Nenhum documento encontrado com os filtros aplicados</p>
                <p className="text-gray-400 mt-2">Tente ajustar os filtros ou criar novos documentos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
