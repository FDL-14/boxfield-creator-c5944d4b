
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
      // Primeiro, verificar se o usuário é admin ou master usando a função RPC
      const { data, error } = await supabase.rpc('check_user_role', {
        user_id: userId
      });
      
      if (!error && data) {
        // Corrigir o tratamento da resposta
        let userRole: UserRoleData;
        
        if (Array.isArray(data) && data.length > 0) {
          userRole = data[0];
        } else {
          userRole = data as unknown as UserRoleData;
        }
        
        // Se for admin ou master, conceder permissão automaticamente
        if (userRole?.is_master === true || userRole?.is_admin === true) {
          return true;
        }
      }
      
      // Caso contrário, verificar permissões específicas
      const { data: permData, error: permError } = await supabase
        .from('user_permissions')
        .select(permission)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (permError) return false;
      
      return permData && permData[permission] === true;
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return false;
    }
  },
  
  /**
   * Verifica se o usuário tem permissão para editar um documento específico
   */
  canEditDocument: async (userId: string, documentId: string) => {
    try {
      // Verificar se é admin/master primeiro
      const isAdmin = await UserService.hasPermission(userId, 'can_edit_document');
      if (isAdmin) return true;
      
      // Verificar permissões específicas para o documento
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', documentId)
        .single();
        
      if (error) return false;
      
      // Verificar se o usuário é o criador do documento
      return data.created_by === userId;
    } catch (error) {
      console.error("Erro ao verificar permissão do documento:", error);
      return false;
    }
  }
};

interface UserRoleData {
  is_admin: boolean;
  is_master: boolean;
}
