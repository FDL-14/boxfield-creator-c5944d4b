
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
import { Loader2, Pencil, Trash2, BuildingOffice2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Group {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  cnpj: string | null;
  phone: string | null;
  is_active: boolean;
  group_client_id: string;
  group_name?: string;
  created_at: string;
  updated_at: string;
}

const CompaniesManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCompany, setNewCompany] = useState<{
    name: string;
    description: string;
    address: string;
    cnpj: string;
    phone: string;
    is_active: boolean;
    group_client_id: string;
  }>({
    name: '',
    description: '',
    address: '',
    cnpj: '',
    phone: '',
    is_active: true,
    group_client_id: '',
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
    fetchCompanies();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups_clients')
        .select('id, name')
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setGroups(data || []);
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar grupos',
        description: error.message,
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies_units')
        .select(`
          *,
          groups_clients(id, name)
        `)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;

      // Transform the data to include group name
      const formattedCompanies = data?.map(company => {
        let group_name = 'Sem grupo';
        if (company.groups_clients && 
            typeof company.groups_clients === 'object' && 
            company.groups_clients !== null) {
          group_name = (company.groups_clients as any).name || 'Sem grupo';
        }
        
        return {
          ...company,
          group_name,
        };
      }) || [];

      setCompanies(formattedCompanies);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar empresas',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      if (!newCompany.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome da empresa é obrigatório.',
        });
        return;
      }

      if (!newCompany.group_client_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar um grupo.',
        });
        return;
      }

      setLoading(true);
      
      const { data, error } = await supabase
        .from('companies_units')
        .insert([
          {
            name: newCompany.name,
            description: newCompany.description || null,
            address: newCompany.address || null,
            cnpj: newCompany.cnpj || null,
            phone: newCompany.phone || null,
            is_active: newCompany.is_active,
            group_client_id: newCompany.group_client_id
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setNewCompany({ 
        name: '', 
        description: '', 
        address: '', 
        cnpj: '', 
        phone: '', 
        is_active: true,
        group_client_id: ''
      });
      
      toast({
        title: 'Empresa criada',
        description: 'A empresa foi criada com sucesso.',
      });
      
      fetchCompanies();
    } catch (error: any) {
      console.error("Create company error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar empresa',
        description: error.message || 'Ocorreu um erro ao criar a empresa',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    try {
      if (!editingCompany?.name.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'O nome da empresa é obrigatório.',
        });
        return;
      }

      if (!editingCompany.group_client_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar um grupo.',
        });
        return;
      }

      setLoading(true);
      
      const { error } = await supabase
        .from('companies_units')
        .update({
          name: editingCompany.name,
          description: editingCompany.description,
          address: editingCompany.address,
          cnpj: editingCompany.cnpj,
          phone: editingCompany.phone,
          is_active: editingCompany.is_active,
          group_client_id: editingCompany.group_client_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCompany.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      setIsEditing(false);
      setEditingCompany(null);
      toast({
        title: 'Empresa atualizada',
        description: 'A empresa foi atualizada com sucesso.',
      });
      
      fetchCompanies();
    } catch (error: any) {
      console.error("Update company error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar empresa',
        description: error.message || 'Ocorreu um erro ao atualizar a empresa',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    try {
      if (!companyToDelete) return;

      setLoading(true);
      
      const { error } = await supabase
        .from('companies_units')
        .update({ is_deleted: true })
        .eq('id', companyToDelete);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setCompanies(companies.filter(company => company.id !== companyToDelete));
      setCompanyToDelete(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Empresa excluída',
        description: 'A empresa foi excluída com sucesso.',
      });
    } catch (error: any) {
      console.error("Delete company error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir empresa',
        description: error.message || 'Ocorreu um erro ao excluir a empresa',
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCompanyToDelete(id);
    setIsDialogOpen(true);
  };

  const startEditing = (company: Company) => {
    setEditingCompany({ ...company });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingCompany(null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto py-6">
      <MainHeader 
        title="Gerenciar Empresas/Unidades" 
        rightContent={
          <Button 
            onClick={() => setIsEditing(false)} 
            className="flex items-center gap-2"
          >
            <BuildingOffice2 className="h-4 w-4" />
            Inserir Nova Empresa
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Empresas/Unidades</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome da empresa *"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome da empresa/unidade</span>
                </div>
                <div>
                  <Select
                    value={newCompany.group_client_id}
                    onValueChange={(value) => setNewCompany({ ...newCompany, group_client_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Selecione um grupo *" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Grupo ao qual a empresa pertence</span>
                </div>
                <div>
                  <Input
                    placeholder="CNPJ"
                    value={newCompany.cnpj}
                    onChange={(e) => setNewCompany({ ...newCompany, cnpj: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">CNPJ da empresa</span>
                </div>
                <div>
                  <Input
                    placeholder="Telefone"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Telefone de contato</span>
                </div>
                <div className="md:col-span-2">
                  <Input
                    placeholder="Endereço"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Endereço completo</span>
                </div>
                <div className="md:col-span-2">
                  <Input
                    placeholder="Descrição (opcional)"
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição da empresa/unidade</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active-new"
                    checked={newCompany.is_active} 
                    onCheckedChange={(checked) => setNewCompany({...newCompany, is_active: checked})}
                    disabled={loading}
                  />
                  <Label htmlFor="is-active-new">Ativo</Label>
                </div>
              </div>

              <Button onClick={handleCreateCompany} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Empresa/Unidade
              </Button>

              {loading && <div className="py-4">Carregando...</div>}

              {companies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.group_name}</TableCell>
                        <TableCell>{company.cnpj}</TableCell>
                        <TableCell>{company.phone}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {company.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => startEditing(company)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(company.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">Nenhuma empresa/unidade encontrada.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Nome da empresa *"
                    value={editingCompany?.name || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany!, name: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Nome da empresa/unidade</span>
                </div>
                <div>
                  <Select
                    value={editingCompany?.group_client_id || ''}
                    onValueChange={(value) => setEditingCompany({ ...editingCompany!, group_client_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="mb-1">
                      <SelectValue placeholder="Selecione um grupo *" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Grupo ao qual a empresa pertence</span>
                </div>
                <div>
                  <Input
                    placeholder="CNPJ"
                    value={editingCompany?.cnpj || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany!, cnpj: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">CNPJ da empresa</span>
                </div>
                <div>
                  <Input
                    placeholder="Telefone"
                    value={editingCompany?.phone || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany!, phone: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Telefone de contato</span>
                </div>
                <div className="md:col-span-2">
                  <Input
                    placeholder="Endereço"
                    value={editingCompany?.address || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany!, address: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Endereço completo</span>
                </div>
                <div className="md:col-span-2">
                  <Input
                    placeholder="Descrição (opcional)"
                    value={editingCompany?.description || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany!, description: e.target.value })}
                    disabled={loading}
                    className="mb-1"
                  />
                  <span className="text-xs text-muted-foreground">Breve descrição da empresa/unidade</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active-edit"
                    checked={editingCompany?.is_active || false} 
                    onCheckedChange={(checked) => setEditingCompany({...editingCompany!, is_active: checked})}
                    disabled={loading}
                  />
                  <Label htmlFor="is-active-edit">Ativo</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdateCompany} disabled={loading}>
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
              Tem certeza de que deseja excluir esta empresa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompaniesManager;
