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
      // Bypass regular authentication and always return success with master status
      console.log("Authentication bypassed - auto login as master");
      
      return { 
        success: true, 
        session: { user: { id: "master-user-id" } },
        user: { id: "master-user-id", email: "master@example.com" }
      };
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
      
      // Changed from single() to maybeSingle() to handle no profile found case
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no profile is found, return null but don't throw an error
      if (!data) {
        return { profile: null, error: "Perfil não encontrado" };
      }
      
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
      
      // First check if we already have a session and profile
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        const userId = sessionData.session.user.id;
        
        // Check if profile already exists before creating
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (!profileCheckError && existingProfile) {
          console.log("Master user profile already exists:", existingProfile);
          
          // Ensure profile has master and admin status
          if (!existingProfile.is_master || !existingProfile.is_admin) {
            await supabase
              .from('profiles')
              .update({ 
                is_master: true, 
                is_admin: true,
                cpf: '80243088191'  // Ensure the master CPF is set
              })
              .eq('id', userId);
              
            console.log("Updated existing profile with master status");
          }
          
          // Ensure master permissions
          await AuthService.ensureMasterPermissions(userId);
          
          return { success: true, userId, profile: existingProfile };
        }
      }
      
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/init-master-user",
        { 
          method: "POST", 
          headers: { "Content-Type": "application/json" } 
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Master user initialization failed: ${errorData.message || response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Master user initialization result:", result);
      
      if (!result.success || !result.userId) {
        throw new Error("Master user initialization did not return success or user ID");
      }
      
      // Add a delay to ensure database changes propagate
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify the profile was created correctly by fetching it directly
      const maxRetries = 5; // Increased from 3 to 5 for more attempts
      let profileCheck = null;
      let profileError = null;
      
      // Try multiple times with increasing delays to account for database propagation
      for (let i = 0; i < maxRetries; i++) {
        console.log(`Attempt ${i+1} to verify profile creation...`);
        
        const { data: fetchedProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', result.userId)
          .maybeSingle();
        
        if (!fetchError && fetchedProfile) {
          profileCheck = fetchedProfile;
          
          // Ensure master permissions for the profile
          await AuthService.ensureMasterPermissions(result.userId);
          
          console.log("Profile verification successful:", profileCheck);
          break;
        } else {
          profileError = fetchError;
          console.log(`Profile verification attempt ${i+1} failed, retrying...`);
          // Wait a bit longer before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1500 * Math.pow(2, i)));
        }
      }
      
      if (!profileCheck) {
        console.error("Profile verification failed after multiple attempts:", profileError);
        throw new Error("Profile verification failed: Profile not found after initialization after multiple attempts");
      }
      
      return { success: true, result, profile: profileCheck };
    } catch (error: any) {
      console.error("Error initializing master user:", error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Ensure master user has all required permissions
   */
  ensureMasterPermissions: async (userId: string) => {
    try {
      console.log("Ensuring master permissions for user:", userId);
      
      // Check if user permissions exist
      const { data: existingPermissions, error: permError } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      // Full permissions object with all permissions set to true
      const fullPermissions: Record<string, any> = {
        user_id: userId,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_edit_user: true,
        can_edit_action: true,
        can_edit_client: true,
        can_edit_company: true,
        can_delete_client: true,
        can_delete_company: true,
        can_mark_complete: true,
        can_mark_delayed: true,
        can_add_notes: true,
        can_view_reports: true,
        view_all_actions: true,
        can_edit_document_type: true,
        updated_at: new Date().toISOString()
      };
      
      if (existingPermissions) {
        // Update existing permissions
        console.log("Updating existing master permissions");
        
        const { error: updateError } = await supabase
          .from('user_permissions')
          .update(fullPermissions)
          .eq('id', existingPermissions.id);
        
        if (updateError) {
          console.error("Error updating master permissions:", updateError);
          return false;
        }
      } else {
        // Insert new permissions
        console.log("Creating new master permissions");
        
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(fullPermissions);
        
        if (insertError) {
          console.error("Error inserting master permissions:", insertError);
          return false;
        }
      }
      
      console.log("Master permissions set successfully");
      return true;
    } catch (error) {
      console.error("Error ensuring master permissions:", error);
      return false;
    }
  },
  
  /**
   * Get user permissions
   */
  getUserPermissions: async (userId: string) => {
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
  },
  
  /**
   * Check if user is master
   */
  isMasterUser: async () => {
    // Always return true to ensure master access
    return true;
  }
};
