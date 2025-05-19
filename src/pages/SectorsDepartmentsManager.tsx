
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainHeader from '@/components/MainHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, Trash2, Building } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
}

interface Sector {
  id: string;
  name: string;
  description: string | null;
  building_type: string | null;
  floor_type: string | null;
  cover_type: string | null;
  closure_type: string | null;
  lighting_type: string | null;
  ventilation_type: string | null;
  ceiling_height: number | null;
  area: number | null;
  is_active: boolean;
  company_unit_id: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

const SectorsDepartmentsManager: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newSector, setNewSector] = useState<{
    name: string;
    description: string;
    building_type: string;
    floor_type: string;
    cover_type: string;
    closure_type: string;
    lighting_type: string;
    ventilation_type: string;
    ceiling_height: string;
    area: string;
    is_active: boolean;
    company_unit_id: string;
  }>({
    name: '',
    description: '',
    building_type: 'Não Informado',
    floor_type: 'Não Informado',
    cover_type: 'Não Informado',
    closure_type: 'Não Informado',
    lighting_type: 'Não Informado',
    ventilation_type: 'Não Informado',
    ceiling_height: '',
    area: '',
    is_active: true,
    company_unit_id: '',
  });
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [sectorToDelete, setSectorToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
    fetchSectors();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies_units')
        .select('id, name')
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setCompanies(data || []);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar empresas',
        description: error.message,
      });
    }
  };

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sectors_departments')
        .select(`
          *,
          companies_units(id, name)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      // Transform the data to include company name
      const formattedSectors = data?.map(sector => {
        let company_name = 'Sem empresa';
        if (sector.companies_units && 
            typeof sector.companies_units === 'object' && 
            sector.companies_units !== null) {
          company_name = (sector.companies_units as any).name || 'Sem empresa';
        }
        
        return {
          ...sector,
          company_name,
        };
      }) || [];

      setSectors(formattedSectors);
    } catch (error: any) {
      console.error("Error fetching sectors:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar setores',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSector = async () => {
    try {
      if (!newSector.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome do setor é obrigatório.',
        });
        return;
      }

      if (!newSector.company_unit_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar uma empresa.',
        });
        return;
      }

      setLoading(true);
      
      const { data, error } = await supabase
        .from('sectors_departments')
        .insert([
          {
            name: newSector.name,
            description: newSector.description || null,
            building_type: newSector.building_type,
            floor_type: newSector.floor_type,
            cover_type: newSector.cover_type,
            closure_type: newSector.closure_type,
            lighting_type: newSector.lighting_type,
            ventilation_type: newSector.ventilation_type,
            ceiling_height: newSector.ceiling_height ? parseFloat(newSector.ceiling_height) : null,
            area: newSector.area ? parseFloat(newSector.area) : null,
            is_active: newSector.is_active,
            company_unit_id: newSector.company_unit_id
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setNewSector({
        name: '',
        description: '',
        building_type: 'Não Informado',
        floor_type: 'Não Informado',
        cover_type: 'Não Informado',
        closure_type: 'Não Informado',
        lighting_type: 'Não Informado',
        ventilation_type: 'Não Informado',
        ceiling_height: '',
        area: '',
        is_active: true,
        company_unit_id: '',
      });
      
      toast({
        title: 'Setor criado',
        description: 'O setor foi criado com sucesso.',
      });
      
      fetchSectors();
    } catch (error: any) {
      console.error("Create sector error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar setor',
        description: error.message || 'Ocorreu um erro ao criar o setor',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSector = async () => {
    try {
      if (!editingSector?.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome do setor é obrigatório.',
        });
        return;
      }

      if (!editingSector.company_unit_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar uma empresa.',
        });
        return;
      }

      setLoading(true);
      
      const { error } = await supabase
        .from('sectors_departments')
        .update({
          name: editingSector.name,
          description: editingSector.description,
          building_type: editingSector.building_type,
          floor_type: editingSector.floor_type,
          cover_type: editingSector.cover_type,
          closure_type: editingSector.closure_type,
          lighting_type: editingSector.lighting_type,
          ventilation_type: editingSector.ventilation_type,
          ceiling_height: editingSector.ceiling_height,
          area: editingSector.area,
          is_active: editingSector.is_active,
          company_unit_id: editingSector.company_unit_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSector.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      setIsEditing(false);
      setEditingSector(null);
      toast({
        title: 'Setor atualizado',
        description: 'O setor foi atualizado com sucesso.',
      });
      
      fetchSectors();
    } catch (error: any) {
      console.error("Update sector error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar setor',
        description: error.message || 'Ocorreu um erro ao atualizar o setor',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSector = async () => {
    try {
      if (!sectorToDelete) return;

      setLoading(true);
      
      const { error } = await supabase
        .from('sectors_departments')
        .update({ is_deleted: true })
        .eq('id', sectorToDelete);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setSectors(sectors.filter(sector => sector.id !== sectorToDelete));
      setSectorToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Setor excluído',
        description: 'O setor foi excluído com sucesso.',
      });
    } catch (error: any) {
      console.error("Delete sector error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir setor',
        description: error.message || 'Ocorreu um erro ao excluir o setor',
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSectorToDelete(id);
    setIsDialogOpen(true);
  };

  const startEditing = (sector: Sector) => {
    setEditingSector({ ...sector });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingSector(null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto py-6">
      <MainHeader 
        title="Gerenciar Setores/Departamentos" 
        rightContent={
          <Button 
            onClick={() => setIsEditing(false)} 
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Inserir Novo Setor
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Setores/Departamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do setor *"
                    value={newSector.name}
                    onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do setor/departamento</span>
                </div>
                <div>
                  <Select
                    value={newSector.company_unit_id}
                    onValueChange={(value) => setNewSector({ ...newSector, company_unit_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Selecione uma empresa *" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Empresa à qual o setor pertence</span>
                </div>
                <div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newSector.description}
                    onChange={(e) => setNewSector({ ...newSector, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição do setor/departamento</span>
                </div>
                <div>
                  <Input
                    placeholder="Área (m²)"
                    type="number"
                    value={newSector.area}
                    onChange={(e) => setNewSector({ ...newSector, area: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Área em metros quadrados</span>
                </div>
                <div>
                  <Input
                    placeholder="Altura do Pé Direito (m)"
                    type="number"
                    value={newSector.ceiling_height}
                    onChange={(e) => setNewSector({ ...newSector, ceiling_height: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Altura do pé direito em metros</span>
                </div>
                <div>
                  <Select
                    value={newSector.building_type}
                    onValueChange={(value) => setNewSector({ ...newSector, building_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Construção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Madeira">Madeira</SelectItem>
                      <SelectItem value="Metálica">Metálica</SelectItem>
                      <SelectItem value="Concreto">Concreto</SelectItem>
                      <SelectItem value="Mista">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de construção do setor</span>
                </div>
                <div>
                  <Select
                    value={newSector.floor_type}
                    onValueChange={(value) => setNewSector({ ...newSector, floor_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Piso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Cerâmica">Cerâmica</SelectItem>
                      <SelectItem value="Concreto">Concreto</SelectItem>
                      <SelectItem value="Madeira">Madeira</SelectItem>
                      <SelectItem value="Vinílico">Vinílico</SelectItem>
                      <SelectItem value="Porcelanato">Porcelanato</SelectItem>
                      <SelectItem value="Cimento Queimado">Cimento Queimado</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de piso do setor</span>
                </div>
                <div>
                  <Select
                    value={newSector.cover_type}
                    onValueChange={(value) => setNewSector({ ...newSector, cover_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Cobertura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Laje">Laje</SelectItem>
                      <SelectItem value="Fibrocimento">Fibrocimento</SelectItem>
                      <SelectItem value="Metálica">Metálica</SelectItem>
                      <SelectItem value="Cerâmica">Cerâmica</SelectItem>
                      <SelectItem value="PVC">PVC</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de cobertura do setor</span>
                </div>
                <div>
                  <Select
                    value={newSector.closure_type}
                    onValueChange={(value) => setNewSector({ ...newSector, closure_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Fechamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Divisória">Divisória</SelectItem>
                      <SelectItem value="Vidro">Vidro</SelectItem>
                      <SelectItem value="Drywall">Drywall</SelectItem>
                      <SelectItem value="Metálico">Metálico</SelectItem>
                      <SelectItem value="Sem fechamento">Sem fechamento</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de fechamento do setor</span>
                </div>
                <div>
                  <Select
                    value={newSector.lighting_type}
                    onValueChange={(value) => setNewSector({ ...newSector, lighting_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Iluminação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Artificial">Artificial</SelectItem>
                      <SelectItem value="Mista">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de iluminação do setor</span>
                </div>
                <div>
                  <Select
                    value={newSector.ventilation_type}
                    onValueChange={(value) => setNewSector({ ...newSector, ventilation_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Ventilação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Artificial">Artificial</SelectItem>
                      <SelectItem value="Mista">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de ventilação do setor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active-new"
                    checked={newSector.is_active} 
                    onCheckedChange={(checked) => setNewSector({...newSector, is_active: checked})}
                    disabled={loading}
                  />
                  <Label htmlFor="is-active-new">Ativo</Label>
                </div>
              </div>

              <Button onClick={handleCreateSector} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Setor/Departamento
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {sectors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Área (m²)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell>{sector.name}</TableCell>
                        <TableCell>{sector.company_name}</TableCell>
                        <TableCell>{sector.area}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${sector.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {sector.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => startEditing(sector)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(sector.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">Nenhum setor/departamento encontrado.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do setor *"
                    value={editingSector?.name || ''}
                    onChange={(e) => setEditingSector({ ...editingSector!, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do setor/departamento</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.company_unit_id || ''}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, company_unit_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Selecione uma empresa *" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Empresa à qual o setor pertence</span>
                </div>
                <div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={editingSector?.description || ''}
                    onChange={(e) => setEditingSector({ ...editingSector!, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição do setor/departamento</span>
                </div>
                <div>
                  <Input
                    placeholder="Área (m²)"
                    type="number"
                    value={editingSector?.area?.toString() || ''}
                    onChange={(e) => setEditingSector({ ...editingSector!, area: parseFloat(e.target.value) || null })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Área em metros quadrados</span>
                </div>
                <div>
                  <Input
                    placeholder="Altura do Pé Direito (m)"
                    type="number"
                    value={editingSector?.ceiling_height?.toString() || ''}
                    onChange={(e) => setEditingSector({ ...editingSector!, ceiling_height: parseFloat(e.target.value) || null })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Altura do pé direito em metros</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.building_type || 'Não Informado'}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, building_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Construção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Madeira">Madeira</SelectItem>
                      <SelectItem value="Metálica">Metálica</SelectItem>
                      <SelectItem value="Concreto">Concreto</SelectItem>
                      <SelectItem value="Mista">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de construção do setor</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.floor_type || 'Não Informado'}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, floor_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Piso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Cerâmica">Cerâmica</SelectItem>
                      <SelectItem value="Concreto">Concreto</SelectItem>
                      <SelectItem value="Madeira">Madeira</SelectItem>
                      <SelectItem value="Vinílico">Vinílico</SelectItem>
                      <SelectItem value="Porcelanato">Porcelanato</SelectItem>
                      <SelectItem value="Cimento Queimado">Cimento Queimado</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de piso do setor</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.cover_type || 'Não Informado'}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, cover_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Cobertura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Laje">Laje</SelectItem>
                      <SelectItem value="Fibrocimento">Fibrocimento</SelectItem>
                      <SelectItem value="Metálica">Metálica</SelectItem>
                      <SelectItem value="Cerâmica">Cerâmica</SelectItem>
                      <SelectItem value="PVC">PVC</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de cobertura do setor</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.closure_type || 'Não Informado'}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, closure_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Fechamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Divisória">Divisória</SelectItem>
                      <SelectItem value="Vidro">Vidro</SelectItem>
                      <SelectItem value="Drywall">Drywall</SelectItem>
                      <SelectItem value="Metálico">Metálico</SelectItem>
                      <SelectItem value="Sem fechamento">Sem fechamento</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de fechamento do setor</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.lighting_type || 'Não Informado'}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, lighting_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Iluminação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Artificial">Artificial</SelectItem>
                      <SelectItem value="Mista">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de iluminação do setor</span>
                </div>
                <div>
                  <Select
                    value={editingSector?.ventilation_type || 'Não Informado'}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, ventilation_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Tipo de Ventilação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Informado">Não Informado</SelectItem>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Artificial">Artificial</SelectItem>
                      <SelectItem value="Mista">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Tipo de ventilação do setor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active-edit"
                    checked={editingSector?.is_active || false} 
                    onCheckedChange={(checked) => setEditingSector({...editingSector!, is_active: checked})}
                    disabled={loading}
                  />
                  <Label htmlFor="is-active-edit">Ativo</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdateSector} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Alterações
                </Button>
                <Button variant="outline" onClick={cancelEditing} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este setor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSector}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SectorsDepartmentsManager;
