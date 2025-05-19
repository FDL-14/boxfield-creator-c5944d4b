import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, PlusCircle, Pencil, Trash2, Building, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MainHeader from "@/components/MainHeader";

export default function ClientsManager() {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load companies for the dropdown
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');
        
      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
      
      // Load clients with company information
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          companies:company_id (id, name)
        `)
        .order('name');
        
      if (clientsError) throw clientsError;
      setClients(clientsData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os clientes ou empresas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (client: any = null) => {
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setCompanyId(client.company_id || "");
      setIsInternal(client.is_internal || false);
      setContactName(client.contact_name || "");
      setContactEmail(client.contact_email || "");
      setContactPhone(client.contact_phone || "");
      setAddress(client.address || "");
      setDocumentId(client.document_id || "");
    } else {
      setEditingClient(null);
      setName("");
      setCompanyId(companies.length > 0 ? companies[0].id : "");
      setIsInternal(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setAddress("");
      setDocumentId("");
    }
    setDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do cliente",
        variant: "destructive"
      });
      return;
    }
    
    if (!companyId) {
      toast({
        title: "Empresa obrigatória",
        description: "Por favor, selecione uma empresa",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const clientData = {
        name,
        company_id: companyId,
        is_internal: isInternal,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address,
        document_id: documentId,
      };
      
      let result;
      
      if (editingClient) {
        // Update existing client
        result = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);
      } else {
        // Insert new client
        result = await supabase
          .from('clients')
          .insert([clientData]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: editingClient ? "Cliente atualizado" : "Cliente cadastrado",
        description: `${name} foi ${editingClient ? "atualizado" : "cadastrado"} com sucesso!`
      });
      
      setDialogOpen(false);
      loadData();
      
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar os dados do cliente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteConfirm = (client: any) => {
    setEditingClient(client);
    setConfirmDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!editingClient) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', editingClient.id);
      
      if (error) throw error;
      
      toast({
        title: "Cliente excluído",
        description: `${editingClient.name} foi excluído com sucesso!`
      });
      
      setConfirmDialogOpen(false);
      loadData();
      
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir o cliente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatPhone = (value: string) => {
    // Remove non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as phone: (00) 00000-0000
    const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
    
    if (!match) return value;
    
    return !match[1] ? '' :
           `(${match[1]})${match[2] ? ` ${match[2]}` : ''}${match[3] ? `-${match[3]}` : ''}`;
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactPhone(formatPhone(e.target.value));
  };
  
  return (
    <div className="container mx-auto py-8">
      <MainHeader 
        title="Gerenciamento de Clientes" 
        subtitle="Cadastre e gerencie todos os clientes" 
        rightContent={
          <Button onClick={() => handleOpenDialog()} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />
      
      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : clients.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.companies?.name || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      client.is_internal 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {client.is_internal ? "Interno" : "Externo"}
                    </span>
                  </TableCell>
                  <TableCell>{client.contact_name || "-"}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{client.contact_email || "-"}</TableCell>
                  <TableCell>{client.contact_phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleOpenDialog(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                        onClick={() => handleDeleteConfirm(client)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="text-center p-6">
          <CardContent className="pt-10 pb-10 flex flex-col items-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-gray-500 mb-6">
              Cadastre seu primeiro cliente para começar a gerenciar documentos.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Cliente
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Add/Edit Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cliente *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select
                  value={companyId}
                  onValueChange={setCompanyId}
                >
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                    {companies.length === 0 && (
                      <SelectItem value="" disabled>
                        Nenhuma empresa cadastrada
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-internal"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="is-internal">Cliente Interno</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document-id">CNPJ/CPF</Label>
                <Input
                  id="document-id"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="Documento de identificação"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nome do Contato</Label>
                <Input
                  id="contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-email">E-mail</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Telefone</Label>
                <Input
                  id="contact-phone"
                  value={contactPhone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Endereço completo"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir o cliente <strong>{editingClient?.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
