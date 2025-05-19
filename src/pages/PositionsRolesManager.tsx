
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

interface Sector {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
  description: string | null;
  sector_department_id: string | null;
  sector_name?: string;
  created_at: string;
  updated_at: string;
}

const PositionsRolesManager: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newPosition, setNewPosition] = useState<{
    name: string;
    description: string;
    sector_department_id: string;
  }>({
    name: '',
    description: '',
    sector_department_id: '',
  });
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [positionToDelete, setPositionToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isMaster, checkPermission } = usePermissions();

  useEffect(() => {
    fetchSectors();
    fetchPositions();
  }, []);

  const fetchSectors = async () => {
    try {
      const { data, error } = await supabase
        .from('sectors_departments')
        .select('id, name')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      setSectors(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar setores',
        description: error.message,
      });
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('positions_roles')
        .select(`
          *,
          sectors_departments(name)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      const formattedPositions = data?.map((position) => ({
        ...position,
        sector_name: position.sectors_departments?.name || 'Sem setor',
      })) || [];

      setPositions(formattedPositions);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cargos/funções',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePosition = async () => {
    try {
      if (!newPosition.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome do cargo é obrigatório.',
        });
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('positions_roles')
        .insert([
          {
            name: newPosition.name,
            description: newPosition.description || null,
            sector_department_id: newPosition.sector_department_id || null,
          },
        ])
        .select();

      if (error) throw error;

      setNewPosition({ name: '', description: '', sector_department_id: '' });
      toast({
        title: 'Cargo criado',
        description: 'O cargo foi criado com sucesso.',
      });
      
      fetchPositions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar cargo',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePosition = async () => {
    try {
      if (!editingPosition?.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome do cargo é obrigatório.',
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase
        .from('positions_roles')
        .update({
          name: editingPosition.name,
          description: editingPosition.description,
          sector_department_id: editingPosition.sector_department_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPosition.id);

      if (error) throw error;

      setIsEditing(false);
      setEditingPosition(null);
      toast({
        title: 'Cargo atualizado',
        description: 'O cargo foi atualizado com sucesso.',
      });
      
      fetchPositions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar cargo',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async () => {
    try {
      if (!positionToDelete) return;

      setLoading(true);
      const { error } = await supabase
        .from('positions_roles')
        .update({ is_deleted: true })
        .eq('id', positionToDelete);

      if (error) throw error;

      setPositions(positions.filter(position => position.id !== positionToDelete));
      setPositionToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Cargo excluído',
        description: 'O cargo foi excluído com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cargo',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setPositionToDelete(id);
    setIsDialogOpen(true);
  };

  const startEditing = (position: Position) => {
    setEditingPosition({ ...position });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingPosition(null);
    setIsEditing(false);
  };

  const canEdit = isAdmin || isMaster || checkPermission('can_edit_company');
  const canDelete = isAdmin || isMaster || checkPermission('can_delete_company');

  return (
    <div className="container mx-auto py-6">
      <MainHeader />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Cargos/Funções</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do cargo/função"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Select
                    value={newPosition.sector_department_id}
                    onValueChange={(value) => setNewPosition({ ...newPosition, sector_department_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newPosition.description}
                    onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button onClick={handleCreatePosition} disabled={loading || !canEdit}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Cargo/Função
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>{position.name}</TableCell>
                        <TableCell>{position.sector_name}</TableCell>
                        <TableCell>{position.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {canEdit && (
                              <Button size="sm" variant="outline" onClick={() => startEditing(position)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(position.id)}>
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
                <div className="text-center py-4">Nenhum cargo/função encontrado.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do cargo/função"
                    value={editingPosition?.name || ''}
                    onChange={(e) => setEditingPosition({ ...editingPosition!, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Select
                    value={editingPosition?.sector_department_id || ''}
                    onValueChange={(value) => setEditingPosition({ ...editingPosition!, sector_department_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={editingPosition?.description || ''}
                    onChange={(e) => setEditingPosition({ ...editingPosition!, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdatePosition} disabled={loading}>
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
              Tem certeza de que deseja excluir este cargo/função? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePosition}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PositionsRolesManager;
