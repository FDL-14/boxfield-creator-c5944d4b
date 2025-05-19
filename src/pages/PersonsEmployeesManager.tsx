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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

interface Position {
  id: string;
  name: string;
}

interface Sector {
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
  rg: string | null;
  rg_state: string | null;
  birth_date: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  admission_date: string | null;
  dismissal_date: string | null;
  position_role_id: string | null;
  position_name?: string;
  sector_department_id: string | null;
  sector_name?: string;
  internal_registration: string | null;
  esocial_registration: string | null;
  nis: string | null;
  cbo: string | null;
  is_active: boolean;
  user_id: string | null;
  user_email?: string | null;
  created_at: string;
  updated_at: string;
}

const PersonsEmployeesManager: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newPerson, setNewPerson] = useState<{
    name: string;
    cpf: string;
    rg: string;
    rg_state: string;
    birth_date: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    admission_date: string;
    dismissal_date: string;
    position_role_id: string;
    sector_department_id: string;
    internal_registration: string;
    esocial_registration: string;
    nis: string;
    cbo: string;
    is_active: boolean;
    user_id: string;
  }>({
    name: '',
    cpf: '',
    rg: '',
    rg_state: '',
    birth_date: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    admission_date: '',
    dismissal_date: '',
    position_role_id: '',
    sector_department_id: '',
    internal_registration: '',
    esocial_registration: '',
    nis: '',
    cbo: '',
    is_active: true,
    user_id: '',
  });
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const { toast } = useToast();
  const { isAdmin, isMaster, checkPermission } = usePermissions();

  useEffect(() => {
    fetchPositions();
    fetchSectors();
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
          positions_roles(id, name),
          sectors_departments(id, name),
          profiles:user_id(id, email)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      // Transform the data to handle the SelectQueryError
      const formattedPersons = data?.map((person) => {
        // Handle positions_roles relationship - specifically fix the name property access
        let position_name = 'Sem cargo';
        if (person.positions_roles && 
            typeof person.positions_roles === 'object' && 
            person.positions_roles !== null) {
          // Safely access name property from positions_roles
          position_name = (person.positions_roles as any).name || 'Sem cargo';
        }
        
        // Handle sectors_departments relationship
        let sector_name = 'Sem setor';
        if (person.sectors_departments && 
            typeof person.sectors_departments === 'object' && 
            person.sectors_departments !== null) {
          sector_name = (person.sectors_departments as any).name || 'Sem setor';
        }
        
        // Safely access the email property with proper null checks
        let user_email = null;
        if (person.profiles && 
            typeof person.profiles === 'object' &&
            person.profiles !== null) {
          user_email = (person.profiles as { email?: string })?.email || null;
        }
        
        return {
          ...person,
          position_name,
          sector_name,
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
            rg: newPerson.rg || null,
            rg_state: newPerson.rg_state || null,
            birth_date: newPerson.birth_date || null,
            gender: newPerson.gender || null,
            email: newPerson.email || null,
            phone: newPerson.phone || null,
            address: newPerson.address || null,
            admission_date: newPerson.admission_date || null,
            dismissal_date: newPerson.dismissal_date || null,
            position_role_id: newPerson.position_role_id || null,
            sector_department_id: newPerson.sector_department_id || null,
            internal_registration: newPerson.internal_registration || null,
            esocial_registration: newPerson.esocial_registration || null,
            nis: newPerson.nis || null,
            cbo: newPerson.cbo || null,
            is_active: newPerson.is_active,
            user_id: newPerson.user_id || null,
          },
        ])
        .select();

      if (error) throw error;

      setNewPerson({
        name: '',
        cpf: '',
        rg: '',
        rg_state: '',
        birth_date: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        admission_date: '',
        dismissal_date: '',
        position_role_id: '',
        sector_department_id: '',
        internal_registration: '',
        esocial_registration: '',
        nis: '',
        cbo: '',
        is_active: true,
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
          rg: editingPerson.rg,
          rg_state: editingPerson.rg_state,
          birth_date: editingPerson.birth_date,
          gender: editingPerson.gender,
          email: editingPerson.email,
          phone: editingPerson.phone,
          address: editingPerson.address,
          admission_date: editingPerson.admission_date,
          dismissal_date: editingPerson.dismissal_date,
          position_role_id: editingPerson.position_role_id,
          sector_department_id: editingPerson.sector_department_id,
          internal_registration: editingPerson.internal_registration,
          esocial_registration: editingPerson.esocial_registration,
          nis: editingPerson.nis,
          cbo: editingPerson.cbo,
          is_active: editingPerson.is_active,
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '';
    }
  };

  const renderFormTabs = (isPerson: Person | null = null) => {
    const person = isPerson || newPerson;
    const isUpdate = isPerson !== null;
    
    return (
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="work">Dados Profissionais</TabsTrigger>
          <TabsTrigger value="details">Dados Adicionais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Nome *"
                value={isUpdate ? editingPerson?.name || '' : person.name}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, name: e.target.value }) : 
                  setNewPerson({ ...newPerson, name: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Nome completo</span>
            </div>
            <div>
              <Input
                placeholder="CPF"
                value={isUpdate ? editingPerson?.cpf || '' : person.cpf}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, cpf: e.target.value }) : 
                  setNewPerson({ ...newPerson, cpf: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">CPF sem pontuação</span>
            </div>
            <div>
              <Input
                placeholder="E-mail"
                value={isUpdate ? editingPerson?.email || '' : person.email}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, email: e.target.value }) : 
                  setNewPerson({ ...newPerson, email: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">E-mail de contato</span>
            </div>
            <div>
              <Input
                placeholder="RG"
                value={isUpdate ? editingPerson?.rg || '' : person.rg}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, rg: e.target.value }) : 
                  setNewPerson({ ...newPerson, rg: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Número do RG</span>
            </div>
            <div>
              <Input
                placeholder="UF do RG"
                value={isUpdate ? editingPerson?.rg_state || '' : person.rg_state}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, rg_state: e.target.value }) : 
                  setNewPerson({ ...newPerson, rg_state: e.target.value })}
                disabled={loading}
                maxLength={2}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Estado emissor do RG</span>
            </div>
            <div>
              <Input
                placeholder="Telefone (WhatsApp)"
                value={isUpdate ? editingPerson?.phone || '' : person.phone}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, phone: e.target.value }) : 
                  setNewPerson({ ...newPerson, phone: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Telefone de contato</span>
            </div>
            <div>
              <Input
                placeholder="Data de Nascimento"
                type="date"
                value={isUpdate ? editingPerson?.birth_date || '' : person.birth_date}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, birth_date: e.target.value }) : 
                  setNewPerson({ ...newPerson, birth_date: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Data de nascimento</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingPerson?.gender || '' : person.gender}
                onValueChange={(value) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, gender: value }) : 
                  setNewPerson({ ...newPerson, gender: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Gênero</span>
            </div>
            <div className="md:col-span-3">
              <Input
                placeholder="Endereço"
                value={isUpdate ? editingPerson?.address || '' : person.address}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, address: e.target.value }) : 
                  setNewPerson({ ...newPerson, address: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Endereço completo</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="work" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Matrícula Interna"
                value={isUpdate ? editingPerson?.internal_registration || '' : person.internal_registration}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, internal_registration: e.target.value }) : 
                  setNewPerson({ ...newPerson, internal_registration: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Número de registro interno</span>
            </div>
            <div>
              <Input
                placeholder="Matrícula eSocial"
                value={isUpdate ? editingPerson?.esocial_registration || '' : person.esocial_registration}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, esocial_registration: e.target.value }) : 
                  setNewPerson({ ...newPerson, esocial_registration: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Matrícula no eSocial</span>
            </div>
            <div>
              <Input
                placeholder="NIS"
                value={isUpdate ? editingPerson?.nis || '' : person.nis}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, nis: e.target.value }) : 
                  setNewPerson({ ...newPerson, nis: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Número de Identificação Social</span>
            </div>
            <div>
              <Input
                placeholder="CBO"
                value={isUpdate ? editingPerson?.cbo || '' : person.cbo}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, cbo: e.target.value }) : 
                  setNewPerson({ ...newPerson, cbo: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Classificação Brasileira de Ocupações</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingPerson?.sector_department_id || '' : person.sector_department_id}
                onValueChange={(value) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, sector_department_id: value }) : 
                  setNewPerson({ ...newPerson, sector_department_id: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Setor/Departamento</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingPerson?.position_role_id || '' : person.position_role_id}
                onValueChange={(value) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, position_role_id: value }) : 
                  setNewPerson({ ...newPerson, position_role_id: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Cargo/Função</span>
            </div>
            <div>
              <Input
                placeholder="Data de Admissão"
                type="date"
                value={isUpdate ? editingPerson?.admission_date || '' : person.admission_date}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, admission_date: e.target.value }) : 
                  setNewPerson({ ...newPerson, admission_date: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Data de admissão</span>
            </div>
            <div>
              <Input
                placeholder="Data de Demissão"
                type="date"
                value={isUpdate ? editingPerson?.dismissal_date || '' : person.dismissal_date}
                onChange={(e) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, dismissal_date: e.target.value }) : 
                  setNewPerson({ ...newPerson, dismissal_date: e.target.value })}
                disabled={loading}
                className="mb-1"
              />
              <span className="text-xs text-muted-foreground">Data de demissão (se aplicável)</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input 
                  type="checkbox" 
                  id={`is-active-${isUpdate ? 'edit' : 'new'}`}
                  checked={isUpdate ? editingPerson?.is_active : person.is_active}
                  onChange={(e) => isUpdate ? 
                    setEditingPerson({ ...editingPerson!, is_active: e.target.checked }) : 
                    setNewPerson({ ...newPerson, is_active: e.target.checked })}
                  disabled={loading}
                  className="rounded text-primary"
                />
                <label htmlFor={`is-active-${isUpdate ? 'edit' : 'new'}`}>Ativo</label>
              </div>
              <span className="text-xs text-muted-foreground">Status da pessoa/empregado</span>
            </div>
            <div>
              <Select
                value={isUpdate ? editingPerson?.user_id || '' : person.user_id}
                onValueChange={(value) => isUpdate ? 
                  setEditingPerson({ ...editingPerson!, user_id: value }) : 
                  setNewPerson({ ...newPerson, user_id: value })}
                disabled={loading}
              >
                <SelectTrigger className="mb-1">
                  <SelectValue placeholder="Vincular a usuário (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Vincular a usuário do sistema</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

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
              {renderFormTabs()}

              <Button onClick={handleCreatePerson} disabled={loading || !canEdit}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Pessoa/Empregado
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {persons.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Admissão</TableHead>
                        <TableHead>Status</TableHead>
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
                          <TableCell>{person.sector_name}</TableCell>
                          <TableCell>{person.internal_registration}</TableCell>
                          <TableCell>{formatDate(person.admission_date)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${person.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {person.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </TableCell>
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
                </div>
              ) : (
                <div className="text-center py-4">Nenhuma pessoa/empregado encontrado.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {renderFormTabs(editingPerson)}

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
