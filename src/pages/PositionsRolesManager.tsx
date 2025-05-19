
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
import { Loader2, Pencil, Trash2, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Sector {
  id: string;
  name: string;
  company_unit_id: string;
}

interface Position {
  id: string;
  name: string;
  description: string | null;
  sector_department_id: string;
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

  useEffect(() => {
    fetchSectors();
    fetchPositions();
  }, []);

  const fetchSectors = async () => {
    try {
      const { data, error } = await supabase
        .from('sectors_departments')
        .select('id, name, company_unit_id')
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setSectors(data || []);
    } catch (error: any) {
      console.error("Error fetching sectors:", error);
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
          sectors_departments(id, name)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      // Transform the data to include sector name
      const formattedPositions = data?.map(position => {
        let sector_name = 'Sem setor';
        if (position.sectors_departments && 
            typeof position.sectors_departments === 'object' && 
            position.sectors_departments !== null) {
          sector_name = (position.sectors_departments as any).name || 'Sem setor';
        }
        
        return {
          ...position,
          sector_name,
        };
      }) || [];

      setPositions(formattedPositions);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cargos',
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

      if (!newPosition.sector_department_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar um setor.',
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
            sector_department_id: newPosition.sector_department_id
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setNewPosition({ 
        name: '', 
        description: '', 
        sector_department_id: '',
      });
      
      toast({
        title: 'Cargo criado',
        description: 'O cargo foi criado com sucesso.',
      });
      
      fetchPositions();
    } catch (error: any) {
      console.error("Create position error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar cargo',
        description: error.message || 'Ocorreu um erro ao criar o cargo',
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

      if (!editingPosition.sector_department_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar um setor.',
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

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      setIsEditing(false);
      setEditingPosition(null);
      toast({
        title: 'Cargo atualizado',
        description: 'O cargo foi atualizado com sucesso.',
      });
      
      fetchPositions();
    } catch (error: any) {
      console.error("Update position error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar cargo',
        description: error.message || 'Ocorreu um erro ao atualizar o cargo',
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

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setPositions(positions.filter(position => position.id !== positionToDelete));
      setPositionToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Cargo excluído',
        description: 'O cargo foi excluído com sucesso.',
      });
    } catch (error: any) {
      console.error("Delete position error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cargo',
        description: error.message || 'Ocorreu um erro ao excluir o cargo',
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
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

  return (
    <div className="container mx-auto py-6">
      <MainHeader 
        title="Gerenciar Cargos/Funções"
        rightContent={
          <Button 
            onClick={() => setIsEditing(false)} 
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Inserir Novo Cargo
          </Button>
        }
      />
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
                    placeholder="Nome do cargo *"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do cargo/função</span>
                </div>
                <div>
                  <Select
                    value={newPosition.sector_department_id}
                    onValueChange={(value) => setNewPosition({ ...newPosition, sector_department_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Selecione um setor *" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Setor ao qual o cargo pertence</span>
                </div>
                <div className="md:col-span-3">
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newPosition.description}
                    onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição do cargo/função</span>
                </div>
              </div>

              <Button onClick={handleCreatePosition} disabled={loading}>
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
                            <Button size="sm" variant="outline" onClick={() => startEditing(position)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(position.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                    placeholder="Nome do cargo *"
                    value={editingPosition?.name || ''}
                    onChange={(e) => setEditingPosition({ ...editingPosition!, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do cargo/função</span>
                </div>
                <div>
                  <Select
                    value={editingPosition?.sector_department_id || ''}
                    onValueChange={(value) => setEditingPosition({ ...editingPosition!, sector_department_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Selecione um setor *" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Setor ao qual o cargo pertence</span>
                </div>
                <div className="md:col-span-3">
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={editingPosition?.description || ''}
                    onChange={(e) => setEditingPosition({ ...editingPosition!, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição do cargo/função</span>
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
              Tem certeza de que deseja excluir este cargo? Esta ação não pode ser desfeita.
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
