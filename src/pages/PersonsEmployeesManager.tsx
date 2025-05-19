
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Pencil, Trash2, UserPlus } from 'lucide-react';

interface Position {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface Person {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  position_role_id: string | null;
  position_name?: string;
  user_id: string | null;
  user_email?: string | null;
  created_at: string;
  updated_at: string;
}

const PersonsEmployeesManager: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newPerson, setNewPerson] = useState<{
    name: string;
    cpf: string;
    email: string;
    phone: string;
    address: string;
    position_role_id: string;
    user_id: string;
  }>({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    position_role_id: '',
    user_id: '',
  });
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isMaster, checkPermission } = usePermissions();

  useEffect(() => {
    fetchPositions();
    fetchUsers();
    fetchPersons();
  }, []);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions_roles')
        .select('id, name')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      setPositions(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cargos',
        description: error.message,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('name');

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar usuários',
        description: error.message,
      });
    }
  };

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('persons_employees')
        .select(`
          *,
          positions_roles(name),
          profiles:user_id(email)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      // Transform the data to handle the SelectQueryError
      const formattedPersons = data?.map((person) => {
        // Handle the potential error case by providing default values
        const position_name = person.positions_roles?.name || 'Sem cargo';
        
        // Safely access the email property with proper null checks
        let user_email = null;
        if (person.profiles && 
            typeof person.profiles === 'object' && 
            person.profiles !== null && 
            'email' in person.profiles) {
          user_email = person.profiles.email;
        }
        
        return {
          ...person,
          position_name,
          user_email,
        };
      }) || [];

      setPersons(formattedPersons);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar pessoas/empregados',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async () => {
    try {
      if (!newPerson.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome da pessoa é obrigatório.',
        });
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('persons_employees')
        .insert([
          {
            name: newPerson.name,
            cpf: newPerson.cpf || null,
            email: newPerson.email || null,
            phone: newPerson.phone || null,
            address: newPerson.address || null,
            position_role_id: newPerson.position_role_id || null,
            user_id: newPerson.user_id || null,
          },
        ])
        .select();

      if (error) throw error;

      setNewPerson({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        address: '',
        position_role_id: '',
        user_id: '',
      });
      toast({
        title: 'Pessoa criada',
        description: 'A pessoa foi criada com sucesso.',
      });
      
      fetchPersons();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar pessoa',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePerson = async () => {
    try {
      if (!editingPerson?.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome da pessoa é obrigatório.',
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase
        .from('persons_employees')
        .update({
          name: editingPerson.name,
          cpf: editingPerson.cpf,
          email: editingPerson.email,
          phone: editingPerson.phone,
          address: editingPerson.address,
          position_role_id: editingPerson.position_role_id,
          user_id: editingPerson.user_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPerson.id);

      if (error) throw error;

      setIsEditing(false);
      setEditingPerson(null);
      toast({
        title: 'Pessoa atualizada',
        description: 'A pessoa foi atualizada com sucesso.',
      });
      
      fetchPersons();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar pessoa',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = async () => {
    try {
      if (!personToDelete) return;

      setLoading(true);
      const { error } = await supabase
        .from('persons_employees')
        .update({ is_deleted: true })
        .eq('id', personToDelete);

      if (error) throw error;

      setPersons(persons.filter(person => person.id !== personToDelete));
      setPersonToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Pessoa excluída',
        description: 'A pessoa foi excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir pessoa',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setPersonToDelete(id);
    setIsDialogOpen(true);
  };

  const startEditing = (person: Person) => {
    setEditingPerson({ ...person });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingPerson(null);
    setIsEditing(false);
  };

  const canEdit = isAdmin || isMaster || checkPermission('can_edit_company');
  const canDelete = isAdmin || isMaster || checkPermission('can_delete_company');

  return (
    <div className="container mx-auto py-6">
      <MainHeader title="Gerenciar Pessoas/Empregados" />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Pessoas/Empregados</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome da pessoa"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="CPF (opcional)"
                    value={newPerson.cpf}
                    onChange={(e) => setNewPerson({ ...newPerson, cpf: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="E-mail (opcional)"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Telefone (opcional)"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Endereço (opcional)"
                    value={newPerson.address}
                    onChange={(e) => setNewPerson({ ...newPerson, address: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Select
                    value={newPerson.position_role_id}
                    onValueChange={(value) => setNewPerson({ ...newPerson, position_role_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={newPerson.user_id}
                    onValueChange={(value) => setNewPerson({ ...newPerson, user_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a usuário (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCreatePerson} disabled={loading || !canEdit}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Pessoa/Empregado
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {persons.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Usuário Vinculado</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {persons.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.cpf}</TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.phone}</TableCell>
                        <TableCell>{person.position_name}</TableCell>
                        <TableCell>{person.user_email}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {canEdit && (
                              <Button size="sm" variant="outline" onClick={() => startEditing(person)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(person.id)}>
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
                <div className="text-center py-4">Nenhuma pessoa/empregado encontrado.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome da pessoa"
                    value={editingPerson?.name || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson!, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="CPF (opcional)"
                    value={editingPerson?.cpf || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson!, cpf: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="E-mail (opcional)"
                    value={editingPerson?.email || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson!, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Telefone (opcional)"
                    value={editingPerson?.phone || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson!, phone: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Endereço (opcional)"
                    value={editingPerson?.address || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson!, address: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Select
                    value={editingPerson?.position_role_id || ''}
                    onValueChange={(value) => setEditingPerson({ ...editingPerson!, position_role_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={editingPerson?.user_id || ''}
                    onValueChange={(value) => setEditingPerson({ ...editingPerson!, user_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a usuário (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdatePerson} disabled={loading}>
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
              Tem certeza de que deseja excluir esta pessoa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerson}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PersonsEmployeesManager;
