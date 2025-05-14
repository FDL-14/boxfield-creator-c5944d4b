import { supabase } from "@/integrations/supabase/client";
import { checkUserPermission, isMasterUser, isAdminUser } from '@/utils/permissionUtils';

/**
 * Serviço responsável por gerenciar usuários e permissões
 */
export const UserService = {
  /**
   * Lista todos os usuários
   */
  listUsers: async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      // Verifica se o usuário é admin ou master primeiro
      const isAdmin = await isAdminUser(userId);
      const isMaster = await isMasterUser(userId);
      
      if (!isAdmin && !isMaster) {
        console.warn("User does not have permission to list users");
        return { users: [], error: "Permissão negada para listar usuários" };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, permissions:user_permissions(*)')
        .order('name');
      
      if (error) throw error;
      
      return { users: data || [], error: null };
    } catch (error: any) {
      console.error("Erro ao listar usuários:", error);
      return { users: [], error: error.message };
    }
  },
  
  /**
   * Obtém um usuário por ID
   */
  getUserById: async (id: string) => {
    try {
      // Primeiro verificar se o usuário atual tem permissão para ver outros usuários
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user?.id;
      
      // Se estiver tentando ver o próprio perfil, ou for admin/master, permitir
      const canViewOthers = await checkUserPermission(currentUserId, 'can_edit_user');
      const isCurrentUser = currentUserId === id;
      
      if (!isCurrentUser && !canViewOthers) {
        return { user: null, error: "Permissão negada para visualizar este usuário" };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, permissions:user_permissions(*)')
        .eq('id', id)
        .maybeSingle(); // Usar maybeSingle para evitar erros quando não encontra
      
      if (error) throw error;
      
      return { user: data, error: null };
    } catch (error: any) {
      console.error("Erro ao obter usuário por ID:", error);
      return { user: null, error: error.message };
    }
  },
  
  /**
   * Atualiza um perfil de usuário
   */
  updateUserProfile: async (id: string, profileData: {
    name?: string;
    email?: string;
    role?: string;
    company_ids?: string[];
    client_ids?: string[];
    is_admin?: boolean;
    is_master?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { user: data, error: null };
    } catch (error: any) {
      console.error("Erro ao atualizar perfil do usuário:", error);
      return { user: null, error: error.message };
    }
  },
  
  /**
   * Atualiza as permissões de um usuário
   */
  updateUserPermissions: async (userId: string, permissions: any) => {
    try {
      // Verificar se já existe registro de permissões
      const { data: existingPermissions } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      let result;
      
      if (existingPermissions) {
        // Atualizar permissões existentes
        const { data, error } = await supabase
          .from('user_permissions')
          .update({
            ...permissions
          })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Criar novas permissões
        const { data, error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            ...permissions
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      return { permissions: result, error: null };
    } catch (error: any) {
      console.error("Erro ao atualizar permissões do usuário:", error);
      return { permissions: null, error: error.message };
    }
  },
  
  /**
   * Adiciona empresas ao perfil do usuário
   */
  addCompanyToUser: async (userId: string, companyId: string) => {
    try {
      // Obter perfil atual
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_ids')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Adicionar companyId se ainda não existir
      let companyIds = profile.company_ids || [];
      if (!companyIds.includes(companyId)) {
        companyIds.push(companyId);
      }
      
      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({ company_ids: companyIds })
        .eq('id', userId);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error("Erro ao adicionar empresa ao usuário:", error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Adiciona clientes ao perfil do usuário
   */
  addClientToUser: async (userId: string, clientId: string) => {
    try {
      // Obter perfil atual
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('client_ids')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Adicionar clientId se ainda não existir
      let clientIds = profile.client_ids || [];
      if (!clientIds.includes(clientId)) {
        clientIds.push(clientId);
      }
      
      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({ client_ids: clientIds })
        .eq('id', userId);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error("Erro ao adicionar cliente ao usuário:", error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Verifica se o usuário tem determinada permissão
   */
  hasPermission: async (userId: string, permission: string) => {
    return await checkUserPermission(userId, permission);
  },
  
  /**
   * Cria um hook personalizado para verificar permissões do usuário atual
   */
  useUserPermissions: () => {
    // Este é um exemplo - a implementação real seria em um custom React hook
    return {
      checkPermission: async (permission: string) => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return false;
        
        return checkUserPermission(data.session.user.id, permission);
      }
    };
  }
};
