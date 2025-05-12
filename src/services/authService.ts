import { supabase } from "@/integrations/supabase/client";

/**
 * Service responsible for managing authentication and users
 */
export const AuthService = {
  /**
   * Authenticates a user with CPF and password
   * @param cpf User's CPF
   * @param password User's password
   */
  login: async (cpf: string, password: string) => {
    try {
      // Clean the CPF (remove non-numeric characters)
      const cleanedCpf = cpf.replace(/\D/g, '');
      
      // Check if it's the master user
      const isMaster = cleanedCpf === '80243088191';
      
      // If master user, try direct login
      if (isMaster) {
        console.log("Attempting login as master user");
        
        try {
          // Try to login with email
          const { data: masterSignInData, error: masterSignInError } = await supabase.auth.signInWithPassword({
            email: "fabiano@totalseguranca.net",
            password: password,
          });
          
          if (!masterSignInError && masterSignInData.session) {
            console.log("Master user login successful with direct email");
            
            // Ensure profile has master status
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', masterSignInData.user.id)
              .single();
              
            if (profileData && (!profileData.is_master || !profileData.is_admin)) {
              // Update profile to ensure master status
              await supabase
                .from('profiles')
                .update({ 
                  is_master: true, 
                  is_admin: true,
                  cpf: cleanedCpf 
                })
                .eq('id', masterSignInData.user.id);
            }
            
            return { success: true, session: masterSignInData.session, user: masterSignInData.user };
          }
        } catch (directMasterError) {
          console.error("Error in direct master login:", directMasterError);
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
        throw new Error(result.message || "Invalid credentials");
      }
      
      // Set the session obtained from the edge function
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token
        });
        
        // Force refresh permissions if master user
        if (isMaster) {
          await AuthService.initMasterUser();
        }
        
        return { 
          success: true, 
          session: result.session, 
          user: result.user
        };
      } else {
        throw new Error("Failed to obtain authentication session");
      }
    } catch (error: any) {
      console.error("Error in login service:", error);
      return { 
        success: false, 
        error: error.message || "Authentication failed" 
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
      // Clean the CPF
      const cleanedCpf = userData.cpf.replace(/\D/g, '');
      
      // Use admin API via edge function for creating user
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
   * Initialize master user
   */
  initMasterUser: async () => {
    try {
      console.log("Initializing master user...");
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/init-master-user",
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      
      const result = await response.json();
      console.log("Master user initialization result:", result);
      return { success: response.ok, result };
    } catch (error: any) {
      console.error("Error initializing master user:", error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get user permissions
   */
  getUserPermissions: async (userId: string) => {
    try {
      // First check if user is master by profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      // If master user, return all permissions enabled
      if (profile && (profile.is_master || profile.cpf === '80243088191')) {
        console.log("Master user detected, returning all permissions");
        
        // Create full permissions object with all permissions set to true
        const fullPermissions: Record<string, boolean> = {};
        const permissionsToSet = [
          'can_create_user', 'can_edit_user', 'can_edit_user_status', 
          'can_set_user_permissions', 'can_create_section', 'can_edit_section', 
          'can_delete_section', 'can_create_field', 'can_edit_field', 
          'can_delete_field', 'can_fill_field', 'can_sign', 
          'can_insert_logo', 'can_insert_photo', 'can_save', 
          'can_save_as', 'can_download', 'can_open', 'can_print', 
          'can_edit_document', 'can_cancel_document', 'can_view', 
          'can_edit_document_type'
        ];
        
        permissionsToSet.forEach(permission => {
          fullPermissions[permission] = true;
        });
        
        return { 
          permissions: {
            id: 'master-permissions',
            user_id: userId,
            ...fullPermissions
          }, 
          error: null 
        };
      }
      
      // For non-master users, get permissions from database
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      return { permissions: data, error: null };
    } catch (error: any) {
      console.error("Error getting permissions:", error);
      return { permissions: null, error: error.message };
    }
  },
  
  /**
   * Check if user is master
   */
  isMasterUser: async () => {
    try {
      const { profile } = await AuthService.getCurrentUserProfile();
      
      if (!profile) return false;
      
      // Check master status through multiple methods
      const isMasterByFlag = profile.is_master === true;
      const isMasterByCpf = profile.cpf === '80243088191';
      const isMasterByEmail = profile.email === 'fabiano@totalseguranca.net';
      
      return isMasterByFlag || isMasterByCpf || isMasterByEmail;
    } catch (error) {
      console.error("Error checking master user:", error);
      return false;
    }
  }
};
