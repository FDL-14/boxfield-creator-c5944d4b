import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building, PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import MainHeader from "@/components/MainHeader";

export default function CompaniesManager() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [address, setAddress] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    loadCompanies();
  }, []);
  
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Erro ao carregar empresas",
        description: "Não foi possível carregar a lista de empresas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (company: any = null) => {
    if (company) {
      setEditingCompany(company);
      setName(company.name);
      setLogo(company.logo || "");
      setAddress(company.address || "");
      setCnpj(company.cnpj || "");
      setPhone(company.phone || "");
    } else {
      setEditingCompany(null);
      setName("");
      setLogo("");
      setAddress("");
      setCnpj("");
      setPhone("");
    }
    setDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da empresa",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const companyData = {
        name,
        logo,
        address,
        cnpj,
        phone,
      };
      
      let result;
      
      if (editingCompany) {
        // Update existing company
        result = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', editingCompany.id);
      } else {
        // Insert new company
        result = await supabase
          .from('companies')
          .insert([companyData]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: editingCompany ? "Empresa atualizada" : "Empresa cadastrada",
        description: `${name} foi ${editingCompany ? "atualizada" : "cadastrada"} com sucesso!`
      });
      
      setDialogOpen(false);
      loadCompanies();
      
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar os dados da empresa",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteConfirm = (company: any) => {
    setEditingCompany(company);
    setConfirmDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!editingCompany) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', editingCompany.id);
      
      if (error) throw error;
      
      toast({
        title: "Empresa excluída",
        description: `${editingCompany.name} foi excluída com sucesso!`
      });
      
      setConfirmDialogOpen(false);
      loadCompanies();
      
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir a empresa",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCNPJ = (value: string) => {
    // Remove non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as CNPJ: 00.000.000/0000-00
    const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/);
    
    if (!match) return value;
    
    return !match[1] ? '' :
           `${match[1]}${match[2] ? `.${match[2]}` : ''}${match[3] ? `.${match[3]}` : ''}${match[4] ? `/${match[4]}` : ''}${match[5] ? `-${match[5]}` : ''}`;
  };
  
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
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
    setPhone(formatPhone(e.target.value));
  };
  
  return (
    <div className="container mx-auto py-8">
      <MainHeader 
        title="Gerenciamento de Empresas" 
        subtitle="Cadastre e gerencie todas as empresas" 
        rightContent={
          <Button onClick={() => handleOpenDialog()} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        }
      />
      
      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : companies.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {company.logo && (
                      <img 
                        src={company.logo} 
                        alt={company.name} 
                        className="w-8 h-8 rounded object-contain"
                      />
                    )}
                    {!company.logo && (
                      <Building className="w-6 h-6 text-gray-400" />
                    )}
                    {company.name}
                  </TableCell>
                  <TableCell>{company.cnpj || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{company.address || "-"}</TableCell>
                  <TableCell>{company.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleOpenDialog(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                        onClick={() => handleDeleteConfirm(company)}
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
            <Building className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-gray-500 mb-6">
              Cadastre sua primeira empresa para começar a gerenciar documentos.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Empresa
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Add/Edit Company Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
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
              
              <div className="space-y-2">
                <Label htmlFor="logo">URL do Logo</Label>
                <Input
                  id="logo"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Informe a URL da imagem do logo da empresa
                </p>
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
              Tem certeza que deseja excluir a empresa <strong>{editingCompany?.name}</strong>?
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
