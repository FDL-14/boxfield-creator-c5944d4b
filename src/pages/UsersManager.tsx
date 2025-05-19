
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase, processUserProfile, cleanCPF, isMasterUser } from "@/integrations/supabase/client";
import { User, PlusCircle, Pencil, Trash2, Shield, Mail, Key, Loader2, Check, X, RotateCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";

type UserProfile = {
  id: string;
  name: string;
  email: string | null;
  cpf: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
  client_ids: string[] | null;
  company_ids: string[] | null;
  face_image: string | null;
  is_face_registered: boolean | null;
  is_admin: boolean;
  is_master: boolean;
  permissions?: UserPermission[];
};

type UserPermission = {
  id: string;
  user_id: string | null;
  can_create: boolean | null;
  can_edit: boolean | null;
  can_delete: boolean | null;
  can_mark_complete: boolean | null;
  can_mark_delayed: boolean | null;
  can_add_notes: boolean | null;
  can_view_reports: boolean | null;
  view_all_actions: boolean | null;
  can_edit_user: boolean | null;
  can_edit_action: boolean | null;
  can_edit_client: boolean | null;
  can_edit_company: boolean | null;
  view_only_assigned_actions: boolean | null;
  can_delete_company: boolean | null;
  can_delete_client: boolean | null;
  can_create_user: boolean | null;
  can_edit_user_status: boolean | null;
  can_set_user_permissions: boolean | null;
  can_create_section: boolean | null;
  can_edit_section: boolean | null;
  can_delete_section: boolean | null;
  can_create_field: boolean | null;
  can_edit_field: boolean | null;
  can_delete_field: boolean | null;
  can_fill_field: boolean | null;
  can_sign: boolean | null;
  can_insert_logo: boolean | null;
  can_insert_photo: boolean | null;
  can_save: boolean | null;
  can_save_as: boolean | null;
  can_download: boolean | null;
  can_open: boolean | null;
  can_print: boolean | null;
  can_edit_document: boolean | null;
  can_cancel_document: boolean | null;
  can_view: boolean | null;
  can_edit_document_type: boolean | null;
};

export default function UsersManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("@54321"); // Default password
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  
  // Permissions
  const [permissions, setPermissions] = useState<{[key: string]: boolean}>({
    can_create_user: false,
    can_edit_user: false,
    can_edit_user_status: false,
    can_set_user_permissions: false,
    can_create_section: false,
    can_edit_section: false,
    can_delete_section: false,
    can_create_field: false,
    can_edit_field: false,
    can_delete_field: false,
    can_fill_field: false,
    can_sign: false,
    can_insert_logo: false,
    can_insert_photo: false,
    can_save: false,
    can_save_as: false,
    can_download: false,
    can_open: false,
    can_print: false,
    can_edit_document: false,
    can_cancel_document: false,
    can_view: false,
    can_edit_document_type: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Only load data after authentication check is complete and user has permission
    if (authCheckComplete && hasUserManagementPermission()) {
      loadData();
    }
  }, [authCheckComplete]);
  
  const checkAuth = async () => {
    setLoading(true);
    
    try {
      // Check if user is logged in
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/auth');
        return;
      }
      
      const userId = data.session.user.id;
      setCurrentUserId(userId);
      
      // Fetch the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, permissions:user_permissions(*)')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }
      
      // If profile exists, process it and continue
      if (profileData) {
        const processedProfile = processUserProfile(profileData);
        setCurrentUserProfile(processedProfile);
        setAuthCheckComplete(true);
      } else {
        // Profile doesn't exist yet - try to initialize it
        console.log("Profile not found, attempting to initialize master user...");
        
        try {
          // Try to use init-master-user to create a profile
          const initResponse = await fetch(
            "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/init-master-user",
            { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }
            }
          );
          
          if (!initResponse.ok) {
            const errorData = await initResponse.json();
            throw new Error(`Failed to initialize master user: ${errorData.message || initResponse.statusText}`);
          }
          
          const initResult = await initResponse.json();
          console.log("Master user initialization result:", initResult);
          
          if (initResult.success) {
            // Fetch the newly created profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*, permissions:user_permissions(*)')
              .eq('id', userId)
              .maybeSingle();
              
            if (newProfileError) {
              throw newProfileError;
            }
            
            if (newProfile) {
              const processedNewProfile = processUserProfile(newProfile);
              setCurrentUserProfile(processedNewProfile);
              setAuthCheckComplete(true);
            } else {
              throw new Error("Profile still not found after initialization");
            }
          } else {
            throw new Error(initResult.message || "Failed to initialize master user");
          }
        } catch (initError: any) {
          console.error("Error initializing master user:", initError);
          toast({
            title: "Erro de inicialização",
            description: `Não foi possível inicializar o perfil: ${initError.message}`,
            variant: "destructive"
          });
          navigate('/');
          return;
        }
      }
    } catch (error: any) {
      console.error("Error checking auth:", error);
      toast({
        title: "Erro de autenticação",
        description: error.message || "Ocorreu um erro ao verificar suas permissões",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load users with profile info
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          permissions:user_permissions(*)
        `)
        .order('name');
        
      if (usersError) throw usersError;
      
      // Process each user profile to ensure all required properties exist
      const processedUsers = usersData?.map(user => processUserProfile(user));
      setUsers(processedUsers || []);
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');
        
      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
      
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          company:company_id (name)
        `)
        .order('name');
        
      if (clientsError) throw clientsError;
      setClients(clientsData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os usuários ou dados relacionados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = () => {
    // Check if current user can create users
    if (currentUserProfile && 
        !currentUserProfile.is_admin && 
        !currentUserProfile.is_master && 
        (!currentUserProfile.permissions || !currentUserProfile.permissions[0]?.can_create_user)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para criar novos usuários",
        variant: "destructive"
      });
      return;
    }
    
    setEditingUser(null);
    setName("");
    setEmail("");
    setCpf("");
    setPassword("@54321");
    setIsAdmin(false);
    setSelectedCompanies([]);
    setSelectedClients([]);
    setDialogOpen(true);
  };
  
  const handleOpenPermissions = (user: UserProfile) => {
    // Check if current user can set permissions
    if (currentUserProfile && 
        !currentUserProfile.is_admin && 
        !currentUserProfile.is_master && 
        (!currentUserProfile.permissions || !currentUserProfile.permissions[0]?.can_set_user_permissions)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para modificar permissões de usuários",
        variant: "destructive"
      });
      return;
    }
    
    setEditingUser(user);
    
    // Initialize permissions
    const userPermissions = user.permissions && user.permissions[0] ? user.permissions[0] : {};
    
    // Map permissions from user data
    const permObj: {[key: string]: boolean} = {};
    
    // Fill with all permission fields
    Object.keys(permissions).forEach(key => {
      permObj[key] = userPermissions[key as keyof UserPermission] as boolean || false;
    });
    
    setPermissions(permObj);
    setPermissionsDialogOpen(true);
  };
  
  const handleResetPassword = (user: UserProfile) => {
    // Check if current user can modify users
    if (currentUserProfile && 
        !currentUserProfile.is_admin && 
        !currentUserProfile.is_master && 
        (!currentUserProfile.permissions || !currentUserProfile.permissions[0]?.can_edit_user)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para redefinir senhas",
        variant: "destructive"
      });
      return;
    }
    
    setEditingUser(user);
    setResetPasswordDialogOpen(true);
  };
  
  const handleEditUser = (user: UserProfile) => {
    // Check if current user can edit users
    if (currentUserProfile && 
        !currentUserProfile.is_admin && 
        !currentUserProfile.is_master && 
        (!currentUserProfile.permissions || !currentUserProfile.permissions[0]?.can_edit_user)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para editar usuários",
        variant: "destructive"
      });
      return;
    }
    
    setEditingUser(user);
    setName(user.name || "");
    setEmail(user.email || "");
    setCpf(user.cpf || "");
    setIsAdmin(user.is_admin || false);
    setSelectedCompanies(user.company_ids || []);
    setSelectedClients(user.client_ids || []);
    setDialogOpen(true);
  };
  
  const handleDeleteConfirm = (user: UserProfile) => {
    setEditingUser(user);
    setConfirmDialogOpen(true);
  };
  
  const performPasswordReset = async () => {
    if (!editingUser) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate the CPF email format
      const loginEmail = `${editingUser.cpf?.replace(/\D/g, '')}@cpflogin.local`;
      
      // Get user auth ID by ID directly
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        editingUser.id,
        { password: '@54321' }
      );
      
      if (resetError) throw resetError;
      
      toast({
        title: "Senha redefinida",
        description: `A senha de ${editingUser.name} foi redefinida para o padrão @54321`
      });
      
      setResetPasswordDialogOpen(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao redefinir a senha",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !cpf.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e CPF",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If creating a new user
      if (!editingUser) {
        // Generate the CPF email format for login
        const loginEmail = `${cpf.replace(/\D/g, '')}@cpflogin.local`;
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: loginEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name,
            cpf,
            real_email: email,
            is_admin: isAdmin,
            is_master: false,
            company_ids: selectedCompanies,
            client_ids: selectedClients
          }
        });
        
        if (authError) throw authError;
        
        // The trigger will create the profile and permissions
        
        toast({
          title: "Novo usuário",
          description: `O usuário ${name} foi criado com senha padrão @54321`,
          variant: "default"
        });
      } else {
        // Update existing user profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name,
            email,
            cpf,
            is_admin: isAdmin,
            company_ids: selectedCompanies,
            client_ids: selectedClients,
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        
        toast({
          title: "Usuário atualizado",
          description: `${name} foi atualizado com sucesso!`
        });
      }
      
      setDialogOpen(false);
      loadData();
      
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar os dados do usuário",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!editingUser) return;
    
    // Don't allow deleting yourself
    if (editingUser.id === currentUserId) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
      return;
    }
    
    // Don't allow deleting master user
    if (editingUser.is_master) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir o usuário master do sistema",
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Delete user from Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(editingUser.id);
      
      if (error) throw error;
      
      toast({
        title: "Usuário excluído",
        description: `${editingUser.name} foi excluído com sucesso!`
      });
      
      setConfirmDialogOpen(false);
      loadData();
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir o usuário",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSavePermissions = async () => {
    if (!editingUser) return;
    
    setIsSubmitting(true);
    
    try {
      const userPermissionsId = editingUser.permissions && editingUser.permissions[0] ? 
        editingUser.permissions[0].id : null;
        
      let result;
      
      if (userPermissionsId) {
        // Update existing permissions
        result = await supabase
          .from('user_permissions')
          .update(permissions)
          .eq('id', userPermissionsId);
      } else {
        // Create new permissions
        result = await supabase
          .from('user_permissions')
          .insert([{
            user_id: editingUser.id,
            ...permissions
          }]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: "Permissões atualizadas",
        description: `As permissões de ${editingUser.name} foram atualizadas com sucesso!`
      });
      
      setPermissionsDialogOpen(false);
      loadData();
      
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Erro ao salvar permissões",
        description: error.message || "Ocorreu um erro ao salvar as permissões",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCPF = (value: string) => {
    // Remove non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Limit to 11 digits
    cleaned = cleaned.slice(0, 11);
    
    // Format as CPF: 000.000.000-00
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
  };
  
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };
  
  const toggleCompany = (companyId: string) => {
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    } else {
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  };
  
  const toggleClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };
  
  const selectAllPermissions = () => {
    const allPermissions: {[key: string]: boolean} = {};
    Object.keys(permissions).forEach(key => {
      allPermissions[key] = true;
    });
    setPermissions(allPermissions);
  };
  
  const clearAllPermissions = () => {
    const noPermissions: {[key: string]: boolean} = {};
    Object.keys(permissions).forEach(key => {
      noPermissions[key] = false;
    });
    setPermissions(noPermissions);
  };
  
  // Check if current user has permission to view this page
  const hasUserManagementPermission = useCallback(() => {
    if (!currentUserProfile) return false;
    
    // Check if user is master by CPF or is_master flag
    if (currentUserProfile && isMasterUser(currentUserProfile)) {
      return true;
    }
    
    return (
      currentUserProfile.is_admin || 
      currentUserProfile.is_master || 
      (currentUserProfile.permissions && 
       currentUserProfile.permissions[0] && 
       currentUserProfile.permissions[0].can_create_user)
    );
  }, [currentUserProfile]);
  
  // Check if the current user can manage a specific user
  const canManageUser = useCallback((user: UserProfile) => {
    if (!currentUserProfile) return false;
    
    // Check if user is master by CPF
    if (isMasterUser(currentUserProfile)) {
      return true;
    }
    
    // Master users and admins can manage everyone except master users
    if (currentUserProfile.is_master) return true;
    if (currentUserProfile.is_admin) return !user.is_master;
    
    // Users with can_create_user permission can manage regular users
    if (currentUserProfile.permissions && 
        currentUserProfile.permissions[0] && 
        currentUserProfile.permissions[0].can_create_user) {
      return !user.is_admin && !user.is_master;
    }
    
    return false;
  }, [currentUserProfile]);
  
  return (
    <div className="container mx-auto py-8">
      <Header 
        title="Gerenciamento de Usuários" 
        subtitle="Cadastre e gerencie todos os usuários do sistema" 
      />
      
      <div className="flex justify-end mb-6">
        {hasUserManagementPermission() && (
          <Button onClick={handleOpenDialog} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={user.is_master ? "bg-amber-50" : ""}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.cpf || "-"}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    {user.is_master && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        Master
                      </Badge>
                    )}
                    {user.is_admin && !user.is_master && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        Administrador
                      </Badge>
                    )}
                    {!user.is_admin && !user.is_master && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Usuário
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {canManageUser(user) && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8"
                            onClick={() => handleOpenPermissions(user)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Permissões
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8"
                            onClick={() => handleResetPassword(user)}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Senha
                          </Button>
                          {!user.is_master && user.id !== currentUserId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                              onClick={() => handleDeleteConfirm(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
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
            <User className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-gray-500 mb-6">
              Cadastre seu primeiro usuário para começar a gerenciar documentos.
            </p>
            {hasUserManagementPermission() && (
              <Button onClick={handleOpenDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Usuário
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="companies">Empresas</TabsTrigger>
                <TabsTrigger value="clients">Clientes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF * (Login)</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    required
                    disabled={editingUser !== null} // Can't change CPF of existing user
                  />
                  <p className="text-xs text-muted-foreground">
                    O CPF será utilizado como login do usuário
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    E-mail para contato (opcional)
                  </p>
                </div>
                
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Inicial</Label>
                    <Input
                      id="password"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      A senha inicial padrão é @54321
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="is-admin" 
                    checked={isAdmin}
                    onCheckedChange={(checked) => setIsAdmin(checked === true)}
                    disabled={!currentUserProfile?.is_master && editingUser?.is_master}
                  />
                  <Label htmlFor="is-admin">Usuário Administrador</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="companies" className="py-4">
                <div className="space-y-4">
                  <Label>Empresas Associadas</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione as empresas às quais este usuário terá acesso:
                  </p>
                  
                  <div className="space-y-2">
                    {companies.length > 0 ? (
                      companies.map((company) => (
                        <div key={company.id} className="flex items-center space-x-2 border p-2 rounded">
                          <Checkbox 
                            id={`company-${company.id}`}
                            checked={selectedCompanies.includes(company.id)}
                            onCheckedChange={() => toggleCompany(company.id)}
                          />
                          <Label htmlFor={`company-${company.id}`} className="flex-1">{company.name}</Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma empresa cadastrada ainda.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="clients" className="py-4">
                <div className="space-y-4">
                  <Label>Clientes Associados</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione os clientes aos quais este usuário terá acesso:
                  </p>
                  
                  <div className="space-y-2">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2 border p-2 rounded">
                          <Checkbox 
                            id={`client-${client.id}`}
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={() => toggleClient(client.id)}
                          />
                          <Label htmlFor={`client-${client.id}`} className="flex-1">
                            {client.name}
                            {client.company?.name && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({client.company.name})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum cliente cadastrado ainda.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4">
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
      
      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permissões do Usuário: {editingUser?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={selectAllPermissions}
              >
                <Check className="mr-2 h-4 w-4" />
                Marcar Todas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAllPermissions}
              >
                <X className="mr-2 h-4 w-4" />
                Desmarcar Todas
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Permission checkboxes */}
              {Object.keys(permissions).map((permission) => (
                <div key={permission} className="flex items-center space-x-2 border p-2 rounded">
                  <Checkbox 
                    id={`perm-${permission}`}
                    checked={permissions[permission]}
                    onCheckedChange={(checked) => {
                      setPermissions({
                        ...permissions,
                        [permission]: checked === true
                      });
                    }}
                  />
                  <Label htmlFor={`perm-${permission}`} className="flex-1 text-sm">
                    {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPermissionsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleSavePermissions}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Permissões'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Tem certeza que deseja redefinir a senha de <strong>{editingUser?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              A senha será redefinida para o padrão: <strong>@54321</strong>
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setResetPasswordDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={performPasswordReset}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir o usuário <strong>{editingUser?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta ação não poderá ser desfeita.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
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
                'Confirmar Exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
