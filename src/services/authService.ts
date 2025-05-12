
import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço responsável por gerenciar autenticação e usuários
 */
export const AuthService = {
  /**
   * Autentica um usuário com CPF e senha
   * @param cpf CPF do usuário
   * @param password Senha do usuário
   */
  login: async (cpf: string, password: string) => {
    try {
      // Limpar o CPF (remover caracteres não numéricos)
      const cleanedCpf = cpf.replace(/\D/g, '');
      
      // Verificar se é o usuário master
      const isMaster = cleanedCpf === '80243088191';
      
      // Se for o usuário master, tentar login direto
      if (isMaster) {
        console.log("Tentando login como usuário master");
        
        try {
          // Tentar fazer login com e-mail
          const { data: masterSignInData, error: masterSignInError } = await supabase.auth.signInWithPassword({
            email: "fabiano@totalseguranca.net",
            password: password,
          });
          
          if (!masterSignInError && masterSignInData.session) {
            console.log("Login do usuário master bem-sucedido com email direto");
            return { success: true, session: masterSignInData.session, user: masterSignInData.user };
          }
        } catch (directMasterError) {
          console.error("Erro no login direto do master:", directMasterError);
        }
      }
      
      // Login via API edge function
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/login-with-cpf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cpf: cleanedCpf,
            password: password
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Credenciais inválidas");
      }
      
      // Definir a sessão obtida da edge function
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token
        });
        
        return { 
          success: true, 
          session: result.session, 
          user: result.user
        };
      } else {
        throw new Error("Falha ao obter sessão de autenticação");
      }
    } catch (error: any) {
      console.error("Erro no serviço de login:", error);
      return { 
        success: false, 
        error: error.message || "Falha na autenticação" 
      };
    }
  },
  
  /**
   * Cadastra um novo usuário
   * @param userData Dados do usuário
   */
  signUp: async (userData: {
    cpf: string;
    password: string;
    name: string;
    email: string;
  }) => {
    try {
      // Limpar o CPF
      const cleanedCpf = userData.cpf.replace(/\D/g, '');
      
      // Usar admin API via edge function para criar usuário
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/create-user-with-cpf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cpf: cleanedCpf,
            password: userData.password,
            name: userData.name,
            email: userData.email
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Ocorreu um erro durante o cadastro");
      }
      
      return {
        success: true,
        userId: result.userId,
        message: "Cadastro realizado com sucesso"
      };
    } catch (error: any) {
      console.error("Erro no serviço de cadastro:", error);
      return {
        success: false,
        error: error.message || "Falha no cadastro"
      };
    }
  },
  
  /**
   * Encerra a sessão do usuário atual
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    return { success: !error, error };
  },
  
  /**
   * Obtém a sessão atual do usuário
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },
  
  /**
   * Obtém o perfil do usuário atual
   */
  getCurrentUserProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return { profile: null, error: "Nenhuma sessão ativa" };
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      // Processar o perfil para incluir metadados importantes
      const processedProfile = {
        ...data,
        is_admin: data.is_admin === true,
        is_master: data.is_master === true || data.cpf === '80243088191'
      };
      
      return { profile: processedProfile, error: null };
    } catch (error: any) {
      console.error("Erro ao obter perfil do usuário:", error);
      return { profile: null, error: error.message };
    }
  },
  
  /**
   * Inicializar usuário master
   */
  initMasterUser: async () => {
    try {
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/init-master-user",
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      
      const result = await response.json();
      return { success: response.ok, result };
    } catch (error: any) {
      console.error("Erro ao inicializar usuário master:", error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Obtém permissões do usuário
   */
  getUserPermissions: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      return { permissions: data, error: null };
    } catch (error: any) {
      console.error("Erro ao obter permissões:", error);
      return { permissions: null, error: error.message };
    }
  },
  
  /**
   * Verifica se o usuário é master
   */
  isMasterUser: async () => {
    try {
      const { profile } = await AuthService.getCurrentUserProfile();
      return profile?.is_master === true || profile?.cpf === '80243088191';
    } catch (error) {
      console.error("Erro ao verificar usuário master:", error);
      return false;
    }
  }
};
