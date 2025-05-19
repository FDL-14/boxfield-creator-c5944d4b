
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CompanyUnit {
  id: string;
  name: string;
}

interface Sector {
  id: string;
  name: string;
  description: string | null;
  company_unit_id: string | null;
  company_unit_name?: string;
  building_type: string | null;
  cover_type: string | null;
  ceiling_height: number | null;
  area: number | null;
  floor_type: string | null;
  closure_type: string | null;
  lighting_type: string | null;
  ventilation_type: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const buildingTypes = [
  'Não Informado', 'Bloco', 'Casa', 'Container', 'Escritório administrativo',
  'Escritório administrativo em prédio', 'Fábrica', 'Food Truck', 'Galpão',
  'Loja', 'Loja (em Shopping Center)', 'Loja (em Supermercado)', 'Obra',
  'Outras', 'Pavilhão', 'Prédio', 'Propriedade rural', 'Quiosque',
  'Sala comercial', 'Silo'
];

const coverTypes = [
  'Não Informado', 'Drywall', 'Forro de Gesso', 'Forro de PVC',
  'Laje de concreto', 'Loro', 'Placas de Isopor', 'Telha de Alumínio',
  'Telha de Barro', 'Telha de Concreto', 'Telha de Fibra translúcido',
  'Telha de Fibrocimento', 'Telha de Zinco', 'Teto em gesso'
];

const floorTypes = [
  'Não informado', 'Carpete', 'Cerâmico', 'Cerâmico e gesso (mesclado)',
  'Cimentado', 'Granito', 'Gesso', 'Outros', 'Rodapé', 'Vinílico'
];

const closureTypes = [
  'Não Informado', 'Alvenaria estrutural', 'Concreto armado',
  'Divisório de gesso/drywall', 'Do tipo falso, revestido com Lã de rocha',
  'Do tipo falso, revestido com Rochas de gesso', 'Estrutura em drywall',
  'Estrutura metálica', 'Não há forro (diretamente na laje)', 'Outros',
  'Paredes de concreto', 'Tijolo de barro comum'
];

const lightingTypes = [
  'Não informado', 'Artificial', 'Artificial e Natural',
  'Artificial, através de luminárias embutidas no forro ou fixadas na laje, providas de lâmpadas fluorescentes.',
  'Artificial: Lâmpadas de leds', 'Artificial: Lâmpadas de mercúrio',
  'Artificial: Lâmpadas fluorescentes', 'Artificial: Lâmpadas incandescentes',
  'Natural', 'Natural com claraboias/ domus',
  'Natural e Artificial: Lâmpadas de leds', 'Natural e Artificial: Lâmpadas de mercúrio',
  'Natural e Artificial: Lâmpadas fluorescentes', 'Natural e Artificial: Lâmpadas incandescentes',
  'Natural, através de esquadrias providas de persianas e, Artificial, através de luminárias embutidas no forro ou fixadas na laje, providas de lâmpadas fluorescentes.',
  'Natural, através de esquadrias providas de persianas.', 'Outros'
];

const ventilationTypes = [
  'Não informado', 'Artificial e Natural', 'Artificial: Ventilador',
  'Artificial: Ar Condicionado', 'Artificial: Ar Condicionado Central',
  'Artificial: Exaustor(es)', 'Artificial: Ventilador(es)',
  'Artificial: Ventilador(es) de parede', 'Artificial: Ventilador(es) de teto',
  'Natural', 'Natural e Artificial: Ar Condicionado',
  'Natural e Artificial: Exaustor(es)', 'Natural e Artificial: Ventilador(es)',
  'Natural e Artificial: Ventilador(es) de parede',
  'Natural e Artificial: Ventilador(es) de teto', 'Outros'
];

const SectorsDepartmentsManager: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [companyUnits, setCompanyUnits] = useState<CompanyUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newSector, setNewSector] = useState<{
    name: string;
    description: string;
    company_unit_id: string;
    building_type: string;
    cover_type: string;
    ceiling_height: string;
    area: string;
    floor_type: string;
    closure_type: string;
    lighting_type: string;
    ventilation_type: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    company_unit_id: '',
    building_type: 'Não Informado',
    cover_type: 'Não Informado',
    ceiling_height: '',
    area: '',
    floor_type: 'Não Informado',
    closure_type: 'Não Informado',
    lighting_type: 'Não Informado',
    ventilation_type: 'Não Informado',
    is_active: true,
  });
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [sectorToDelete, setSectorToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const { toast } = useToast();
  const { isAdmin, isMaster, checkPermission } = usePermissions();

  useEffect(() => {
    fetchCompanyUnits();
    fetchSectors();
  }, []);

  const fetchCompanyUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('companies_units')
        .select('id, name')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      setCompanyUnits(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar unidades',
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
          companies_units(name)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      const formattedSectors = data?.map((sector) => ({
        ...sector,
        company_unit_name: sector.companies_units?.name || 'Sem unidade',
      })) || [];

      setSectors(formattedSectors);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar setores/departamentos',
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

      setLoading(true);
      
      // Convert string values to numbers for numeric fields
      const ceiling_height = newSector.ceiling_height ? parseFloat(newSector.ceiling_height) : null;
      const area = newSector.area ? parseFloat(newSector.area) : null;
      
      const { data, error } = await supabase
        .from('sectors_departments')
        .insert([
          {
            name: newSector.name,
            description: newSector.description || null,
            company_unit_id: newSector.company_unit_id || null,
            building_type: newSector.building_type,
            cover_type: newSector.cover_type,
            ceiling_height,
            area,
            floor_type: newSector.floor_type,
            closure_type: newSector.closure_type,
            lighting_type: newSector.lighting_type,
            ventilation_type: newSector.ventilation_type,
            is_active: newSector.is_active,
          },
        ])
        .select();

      if (error) throw error;

      setNewSector({
        name: '',
        description: '',
        company_unit_id: '',
        building_type: 'Não Informado',
        cover_type: 'Não Informado',
        ceiling_height: '',
        area: '',
        floor_type: 'Não Informado',
        closure_type: 'Não Informado',
        lighting_type: 'Não Informado',
        ventilation_type: 'Não Informado',
        is_active: true,
      });
      
      toast({
        title: 'Setor criado',
        description: 'O setor foi criado com sucesso.',
      });
      
      fetchSectors();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar setor',
        description: error.message,
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

      setLoading(true);
      
      // Convert values to proper types for DB storage
      const ceiling_height = editingSector.ceiling_height ? 
        (typeof editingSector.ceiling_height === 'string' ? 
          parseFloat(editingSector.ceiling_height) : 
          editingSector.ceiling_height) : 
        null;
      
      const area = editingSector.area ? 
        (typeof editingSector.area === 'string' ? 
          parseFloat(editingSector.area) : 
          editingSector.area) : 
        null;
      
      const { error } = await supabase
        .from('sectors_departments')
        .update({
          name: editingSector.name,
          description: editingSector.description,
          company_unit_id: editingSector.company_unit_id,
          building_type: editingSector.building_type,
          cover_type: editingSector.cover_type,
          ceiling_height,
          area,
          floor_type: editingSector.floor_type,
          closure_type: editingSector.closure_type,
          lighting_type: editingSector.lighting_type,
          ventilation_type: editingSector.ventilation_type,
          is_active: editingSector.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSector.id);

      if (error) throw error;

      setIsEditing(false);
      setEditingSector(null);
      toast({
        title: 'Setor atualizado',
        description: 'O setor foi atualizado com sucesso.',
      });
      
      fetchSectors();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar setor',
        description: error.message,
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

      if (error) throw error;

      setSectors(sectors.filter(sector => sector.id !== sectorToDelete));
      setSectorToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Setor excluído',
        description: 'O setor foi excluído com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir setor',
        description: error.message,
      });
    } finally {
      setLoading(false);
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

  const canEdit = isAdmin || isMaster || checkPermission('can_edit_company');
  const canDelete = isAdmin || isMaster || checkPermission('can_delete_company');

  const renderFormTabs = (isSector: Sector | null = null) => {
    const sector = isSector || newSector;
    const isUpdate = isSector !== null;
    
    return (
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="details">Características</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Nome do setor/departamento *"
                value={isUpdate ? editingSector?.name || '' : sector.name}
                onChange={(e) => isUpdate ? 
                  setEditingSector({ ...editingSector!, name: e.target.value }) : 
                  setNewSector({ ...newSector, name: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Nome do setor/departamento</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingSector?.company_unit_id || '' : sector.company_unit_id}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, company_unit_id: value }) : 
                  setNewSector({ ...newSector, company_unit_id: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {companyUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Unidade relacionada</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id={`is-active-${isUpdate ? 'edit' : 'new'}`}
                checked={isUpdate ? editingSector?.is_active || false : sector.is_active} 
                onCheckedChange={(checked) => isUpdate ? 
                  setEditingSector({...editingSector!, is_active: checked}) : 
                  setNewSector({...newSector, is_active: checked})}
                disabled={loading}
              />
              <Label htmlFor={`is-active-${isUpdate ? 'edit' : 'new'}`}>Ativo</Label>
            </div>
            <div className="md:col-span-3">
              <Textarea
                placeholder="Descrição (opcional)"
                value={isUpdate ? editingSector?.description || '' : sector.description}
                onChange={(e) => isUpdate ? 
                  setEditingSector({ ...editingSector!, description: e.target.value }) : 
                  setNewSector({ ...newSector, description: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Informações adicionais sobre o setor</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                value={isUpdate ? editingSector?.building_type || 'Não Informado' : sector.building_type}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, building_type: value }) : 
                  setNewSector({ ...newSector, building_type: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Tipo da Edificação" />
                </SelectTrigger>
                <SelectContent>
                  {buildingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Tipo da Edificação</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingSector?.cover_type || 'Não Informado' : sector.cover_type}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, cover_type: value }) : 
                  setNewSector({ ...newSector, cover_type: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Tipo da Cobertura" />
                </SelectTrigger>
                <SelectContent>
                  {coverTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Tipo da Cobertura</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingSector?.floor_type || 'Não Informado' : sector.floor_type}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, floor_type: value }) : 
                  setNewSector({ ...newSector, floor_type: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Tipo do Piso" />
                </SelectTrigger>
                <SelectContent>
                  {floorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Tipo do Piso</span>
            </div>
            <div>
              <Input
                placeholder="Altura do Pé Direito (em metros)"
                type="number"
                step="0.01"
                value={isUpdate ? 
                  (editingSector?.ceiling_height === null ? '' : editingSector?.ceiling_height) : 
                  sector.ceiling_height}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isUpdate) {
                    setEditingSector({ ...editingSector!, ceiling_height: value === '' ? null : value });
                  } else {
                    setNewSector({ ...newSector, ceiling_height: value });
                  }
                }}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Altura do pé direito em metros</span>
            </div>
            <div>
              <Input
                placeholder="Área (em m²)"
                type="number"
                step="0.01"
                value={isUpdate ? 
                  (editingSector?.area === null ? '' : editingSector?.area) : 
                  sector.area}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isUpdate) {
                    setEditingSector({ ...editingSector!, area: value === '' ? null : value });
                  } else {
                    setNewSector({ ...newSector, area: value });
                  }
                }}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Área em metros quadrados</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingSector?.closure_type || 'Não Informado' : sector.closure_type}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, closure_type: value }) : 
                  setNewSector({ ...newSector, closure_type: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Tipo do Fechamento" />
                </SelectTrigger>
                <SelectContent>
                  {closureTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Tipo do Fechamento</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingSector?.lighting_type || 'Não Informado' : sector.lighting_type}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, lighting_type: value }) : 
                  setNewSector({ ...newSector, lighting_type: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Tipo de Iluminação" />
                </SelectTrigger>
                <SelectContent>
                  {lightingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Tipo de Iluminação</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingSector?.ventilation_type || 'Não Informado' : sector.ventilation_type}
                onValueChange={(value) => isUpdate ? 
                  setEditingSector({ ...editingSector!, ventilation_type: value }) : 
                  setNewSector({ ...newSector, ventilation_type: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Tipo de Ventilação" />
                </SelectTrigger>
                <SelectContent>
                  {ventilationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Tipo de Ventilação</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <MainHeader title="Gerenciar Setores/Departamentos" />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Setores/Departamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              {renderFormTabs()}

              <Button onClick={handleCreateSector} disabled={loading || !canEdit}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Setor/Departamento
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {sectors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Tipo de Edificação</TableHead>
                      <TableHead>Área (m²)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell>{sector.name}</TableCell>
                        <TableCell>{sector.company_unit_name}</TableCell>
                        <TableCell>{sector.building_type}</TableCell>
                        <TableCell>{sector.area !== null ? `${sector.area} m²` : '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${sector.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {sector.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {canEdit && (
                              <Button size="sm" variant="outline" onClick={() => startEditing(sector)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(sector.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
              {renderFormTabs(editingSector)}

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
              Tem certeza de que deseja excluir este setor/departamento? Esta ação não pode ser desfeita.
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
