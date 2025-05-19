
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
import { Loader2, Pencil, Trash2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const GroupsClientsManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newGroup, setNewGroup] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isMaster, checkPermission } = usePermissions();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups_clients')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      setGroups(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar grupos/clientes',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      if (!newGroup.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome do grupo é obrigatório.',
        });
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('groups_clients')
        .insert([
          {
            name: newGroup.name,
            description: newGroup.description || null,
          },
        ])
        .select();

      if (error) throw error;

      setGroups([...(data || []), ...groups]);
      setNewGroup({ name: '', description: '' });
      toast({
        title: 'Grupo criado',
        description: 'O grupo foi criado com sucesso.',
      });
      
      fetchGroups();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar grupo',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      if (!editingGroup?.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome do grupo é obrigatório.',
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase
        .from('groups_clients')
        .update({
          name: editingGroup.name,
          description: editingGroup.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingGroup.id);

      if (error) throw error;

      setIsEditing(false);
      setEditingGroup(null);
      toast({
        title: 'Grupo atualizado',
        description: 'O grupo foi atualizado com sucesso.',
      });
      
      fetchGroups();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar grupo',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      if (!groupToDelete) return;

      setLoading(true);
      const { error } = await supabase
        .from('groups_clients')
        .update({ is_deleted: true })
        .eq('id', groupToDelete);

      if (error) throw error;

      setGroups(groups.filter(group => group.id !== groupToDelete));
      setGroupToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Grupo excluído',
        description: 'O grupo foi excluído com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir grupo',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setGroupToDelete(id);
    setIsDialogOpen(true);
  };

  const startEditing = (group: Group) => {
    setEditingGroup({ ...group });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingGroup(null);
    setIsEditing(false);
  };

  const canEdit = isAdmin || isMaster || checkPermission('can_edit_client');
  const canDelete = isAdmin || isMaster || checkPermission('can_delete_client');

  return (
    <div className="container mx-auto py-6">
      <MainHeader title="Gerenciar Grupos/Clientes" />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Grupos/Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do grupo"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button onClick={handleCreateGroup} disabled={loading || !canEdit}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Grupo
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {groups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {canEdit && (
                              <Button size="sm" variant="outline" onClick={() => startEditing(group)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(group.id)}>
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
                <div className="text-center py-4">Nenhum grupo encontrado.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do grupo"
                    value={editingGroup?.name || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={editingGroup?.description || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdateGroup} disabled={loading}>
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
              Tem certeza de que deseja excluir este grupo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupsClientsManager;
