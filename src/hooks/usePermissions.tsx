
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Tipos de permissão
export interface UserPermissions {
  can_create_user: boolean;
  can_edit_user: boolean;
  can_edit_user_status: boolean;
  can_set_user_permissions: boolean;
  can_create_section: boolean;
  can_edit_section: boolean;
  can_delete_section: boolean;
  can_create_field: boolean;
  can_edit_field: boolean;
  can_delete_field: boolean;
  can_fill_field: boolean;
  can_sign: boolean;
  can_insert_logo: boolean;
  can_insert_photo: boolean;
  can_save: boolean;
  can_save_as: boolean;
  can_download: boolean;
  can_open: boolean;
  can_print: boolean;
  can_edit_document: boolean;
  can_cancel_document: boolean;
  can_view: boolean;
  can_edit_document_type: boolean;
  [key: string]: boolean;
}

// Valor inicial (todas as permissões negadas)
const defaultPermissions: UserPermissions = {
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
  can_edit_document_type: false
};

// Contexto para permissões
interface PermissionsContextType {
  permissions: UserPermissions;
  isAdmin: boolean;
  isMaster: boolean;
  loading: boolean;
  checkPermission: (permission: keyof UserPermissions) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: defaultPermissions,
  isAdmin: false,
  isMaster: false,
  loading: true,
  checkPermission: () => false,
  refreshPermissions: async () => {}
});

// Provider de permissões
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para verificar se é o usuário master
  const checkIfMaster = (profile: any): boolean => {
    if (!profile) return false;
    
    const masterCPF = '80243088191';
    const userCPF = profile.cpf ? profile.cpf.replace(/\D/g, '') : '';
    
    return userCPF === masterCPF || profile.is_master === true;
  };

  // Carregar permissões do usuário atual
  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Verificar se temos sessão ativa
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setPermissions(defaultPermissions);
        setIsAdmin(false);
        setIsMaster(false);
        setLoading(false);
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      try {
        // Buscar perfil do usuário - com tratamento especial para o erro de recursão
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          // Verificar se é o erro de recursão infinita
          if (profileError.code === '42P17') {
            console.log("Erro de recursão detectado, usando perfil padrão");
            // Se for o erro de recursão, criar um perfil básico
            const defaultProfile = {
              id: userId,
              is_admin: false,
              is_master: false
            };
            
            // Verificar se é o CPF master para ainda dar acesso admin
            if (sessionData.session?.user?.email === 'fabiano@totalseguranca.net') {
              defaultProfile.is_master = true;
              defaultProfile.is_admin = true;
            }
            
            // Usar este perfil padrão
            handleUserProfile(defaultProfile);
          } else {
            throw profileError;
          }
        } else {
          // Se não houve erro, processar o perfil normalmente
          handleUserProfile(profile);
        }
      } catch (profileFetchError) {
        console.error("Erro ao buscar perfil:", profileFetchError);
        setPermissions(defaultPermissions);
        setLoading(false);
      }
      
    } catch (error: any) {
      console.error("Erro ao carregar permissões:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar permissões",
        description: "Não foi possível carregar suas permissões de acesso."
      });
      setPermissions(defaultPermissions);
      setLoading(false);
    }
  };
  
  // Função para processar o perfil do usuário e definir permissões
  const handleUserProfile = async (profile: any) => {
    try {
      // Verificar se é admin ou master
      const userIsAdmin = profile.is_admin === true;
      const userIsMaster = checkIfMaster(profile);
      
      setIsAdmin(userIsAdmin);
      setIsMaster(userIsMaster);
      
      // Se for master, conceder todas as permissões
      if (userIsMaster) {
        const allPermissions: UserPermissions = Object.keys(defaultPermissions).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as UserPermissions
        );
        
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }
      
      // Buscar permissões específicas do usuário
      const { data: userPermissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (permissionsError && permissionsError.code !== 'PGRST116') {
        throw permissionsError;
      }
      
      // Combinar permissões padrão com as do banco
      if (userPermissions) {
        // Filtrar apenas as propriedades boolean, ignorando 'id', 'user_id', etc.
        const filteredPermissions: UserPermissions = { ...defaultPermissions };
        
        // Processar apenas as propriedades válidas que estão em defaultPermissions ou que começam com "can_"
        Object.keys(userPermissions).forEach(key => {
          if (key in defaultPermissions || key.startsWith('can_')) {
            // Garantir que atribuímos apenas valores booleanos
            filteredPermissions[key] = Boolean(userPermissions[key]);
          }
        });
        
        // Se é admin, adicionar permissões administrativas
        if (userIsAdmin) {
          filteredPermissions.can_create_user = true;
          filteredPermissions.can_edit_user = true;
          filteredPermissions.can_edit_user_status = true;
          filteredPermissions.can_edit_document_type = true;
        }
        
        setPermissions(filteredPermissions);
      }
    } catch (error) {
      console.error("Erro ao processar perfil do usuário:", error);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário tem uma permissão específica
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    // Verificar se a permissão existe e está ativada
    if (isMaster) return true; // Usuário master tem todas as permissões
    return permissions[permission] === true;
  };

  // Função para forçar atualização das permissões
  const refreshPermissions = async () => {
    await loadPermissions();
  };

  // Carregar permissões na inicialização
  useEffect(() => {
    loadPermissions();
    
    // Escutar mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          loadPermissions();
        } else if (event === 'SIGNED_OUT') {
          setPermissions(defaultPermissions);
          setIsAdmin(false);
          setIsMaster(false);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    permissions,
    isAdmin,
    isMaster,
    loading,
    checkPermission,
    refreshPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook para usar permissões
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions deve ser usado dentro de PermissionsProvider');
  }
  return context;
}
