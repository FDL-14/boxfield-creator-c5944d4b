
import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço responsável por gerenciar usuários e permissões
 */
export const UserService = {
  /**
   * Lista todos os usuários
   */
  listUsers: async () => {
    try {
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*, permissions:user_permissions(*)')
        .eq('id', id)
        .single();
      
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
    try {
      // Primeiro, verificar se o usuário é admin ou master usando nossa função RPC
      const { data, error } = await supabase.rpc('check_user_role', {
        user_id: userId
      });
      
      if (!error && data && data.length > 0) {
        // Se for admin ou master, conceder permissão automaticamente
        if (data[0].is_master === true || data[0].is_admin === true) {
          return true;
        }
      }
      
      // Caso contrário, verificar permissões específicas
      const { data: permData, error: permError } = await supabase
        .from('user_permissions')
        .select(permission)
        .eq('user_id', userId)
        .single();
      
      if (permError) return false;
      
      return permData && permData[permission] === true;
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return false;
    }
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
        
        return UserService.hasPermission(data.session.user.id, permission);
      }
    };
  }
};
