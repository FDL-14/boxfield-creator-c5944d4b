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
import { Loader2, Pencil, Trash2, UserPlus } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Group {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const GroupsClientsManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newGroup, setNewGroup] = useState<{
    name: string;
    description: string;
    phone: string;
    email: string;
    contact_name: string;
    notes: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    phone: '',
    email: '',
    contact_name: '',
    notes: '',
    is_active: true,
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
      console.error("Error fetching groups:", error);
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
            phone: newGroup.phone || null,
            email: newGroup.email || null,
            contact_name: newGroup.contact_name || null,
            notes: newGroup.notes || null,
            is_active: newGroup.is_active
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setGroups([...(data || []), ...groups]);
      setNewGroup({ 
        name: '', 
        description: '', 
        phone: '', 
        email: '', 
        contact_name: '', 
        notes: '', 
        is_active: true 
      });
      
      toast({
        title: 'Grupo criado',
        description: 'O grupo foi criado com sucesso.',
      });
      
      fetchGroups();
    } catch (error: any) {
      console.error("Create group error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar grupo',
        description: error.message || 'Ocorreu um erro ao criar o grupo',
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
          phone: editingGroup.phone,
          email: editingGroup.email,
          contact_name: editingGroup.contact_name,
          notes: editingGroup.notes,
          is_active: editingGroup.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingGroup.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      setIsEditing(false);
      setEditingGroup(null);
      toast({
        title: 'Grupo atualizado',
        description: 'O grupo foi atualizado com sucesso.',
      });
      
      fetchGroups();
    } catch (error: any) {
      console.error("Update group error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar grupo',
        description: error.message || 'Ocorreu um erro ao atualizar o grupo',
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

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setGroups(groups.filter(group => group.id !== groupToDelete));
      setGroupToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Grupo excluído',
        description: 'O grupo foi excluído com sucesso.',
      });
    } catch (error: any) {
      console.error("Delete group error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir grupo',
        description: error.message || 'Ocorreu um erro ao excluir o grupo',
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
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

  return (
    <div className="container mx-auto py-6">
      <MainHeader 
        title="Gerenciar Grupos/Clientes" 
        rightContent={
          <Button 
            onClick={() => setIsEditing(false)} 
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Inserir Novo Grupo
          </Button>
        }
      />
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
                    placeholder="Nome do grupo *"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do grupo/cliente</span>
                </div>
                <div>
                  <Input
                    placeholder="Telefone"
                    value={newGroup.phone}
                    onChange={(e) => setNewGroup({ ...newGroup, phone: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Telefone de contato</span>
                </div>
                <div>
                  <Input
                    placeholder="E-mail"
                    value={newGroup.email}
                    onChange={(e) => setNewGroup({ ...newGroup, email: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">E-mail de contato</span>
                </div>
                <div>
                  <Input
                    placeholder="Nome do responsável/contato"
                    value={newGroup.contact_name}
                    onChange={(e) => setNewGroup({ ...newGroup, contact_name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do responsável</span>
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição do grupo/cliente</span>
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Observações (opcional)"
                    value={newGroup.notes}
                    onChange={(e) => setNewGroup({ ...newGroup, notes: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Outras informações relevantes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active-new"
                    checked={newGroup.is_active} 
                    onCheckedChange={(checked) => setNewGroup({...newGroup, is_active: checked})}
                    disabled={loading}
                  />
                  <Label htmlFor="is-active-new">Ativo</Label>
                </div>
              </div>

              <Button onClick={handleCreateGroup} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Grupo/Cliente
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {groups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.contact_name}</TableCell>
                        <TableCell>{group.email}</TableCell>
                        <TableCell>{group.phone}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${group.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {group.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => startEditing(group)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(group.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">Nenhum grupo/cliente encontrado.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome do grupo *"
                    value={editingGroup?.name || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do grupo/cliente</span>
                </div>
                <div>
                  <Input
                    placeholder="Telefone"
                    value={editingGroup?.phone || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, phone: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Telefone de contato</span>
                </div>
                <div>
                  <Input
                    placeholder="E-mail"
                    value={editingGroup?.email || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, email: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">E-mail de contato</span>
                </div>
                <div>
                  <Input
                    placeholder="Nome do responsável/contato"
                    value={editingGroup?.contact_name || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, contact_name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome do responsável</span>
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={editingGroup?.description || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição do grupo/cliente</span>
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Observações (opcional)"
                    value={editingGroup?.notes || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup!, notes: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Outras informações relevantes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active-edit"
                    checked={editingGroup?.is_active || false} 
                    onCheckedChange={(checked) => setEditingGroup({...editingGroup!, is_active: checked})}
                    disabled={loading}
                  />
                  <Label htmlFor="is-active-edit">Ativo</Label>
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
