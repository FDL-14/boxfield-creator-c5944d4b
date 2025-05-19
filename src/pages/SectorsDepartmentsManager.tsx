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
  created_at: string;
  updated_at: string;
}

const SectorsDepartmentsManager: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [companyUnits, setCompanyUnits] = useState<CompanyUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newSector, setNewSector] = useState<{
    name: string;
    description: string;
    company_unit_id: string;
  }>({
    name: '',
    description: '',
    company_unit_id: '',
  });
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [sectorToDelete, setSectorToDelete] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from('sectors_departments')
        .insert([
          {
            name: newSector.name,
            description: newSector.description || null,
            company_unit_id: newSector.company_unit_id || null,
          },
        ])
        .select();

      if (error) throw error;

      setNewSector({ name: '', description: '', company_unit_id: '' });
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
      const { error } = await supabase
        .from('sectors_departments')
        .update({
          name: editingSector.name,
          description: editingSector.description,
          company_unit_id: editingSector.company_unit_id,
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do setor/departamento"
                    value={newSector.name}
                    onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Select
                    value={newSector.company_unit_id}
                    onValueChange={(value) => setNewSector({ ...newSector, company_unit_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
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
                </div>
                <div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newSector.description}
                    onChange={(e) => setNewSector({ ...newSector, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

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
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell>{sector.name}</TableCell>
                        <TableCell>{sector.company_unit_name}</TableCell>
                        <TableCell>{sector.description}</TableCell>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do setor/departamento"
                    value={editingSector?.name || ''}
                    onChange={(e) => setEditingSector({ ...editingSector!, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Select
                    value={editingSector?.company_unit_id || ''}
                    onValueChange={(value) => setEditingSector({ ...editingSector!, company_unit_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
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
                </div>
                <div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={editingSector?.description || ''}
                    onChange={(e) => setEditingSector({ ...editingSector!, description: e.target.value })}
                    disabled={loading}
                  />
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
