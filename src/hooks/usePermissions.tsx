import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Permission types
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

// Initial value (all permissions denied)
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

// Permissions context
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

// Helper function to safely check if a user is a master user
const isMasterUser = (profile: any): boolean => {
  if (!profile) return false;
  
  // Check by CPF (master CPF hardcoded for security)
  const masterCPF = '80243088191';
  const userCPF = profile.cpf ? profile.cpf.replace(/\D/g, '') : '';
  
  return userCPF === masterCPF || profile.is_master === true;
};

// Define the expected type for roleData 
interface UserRoleData {
  is_admin: boolean;
  is_master: boolean;
}

// Permissions provider
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Load current user permissions
  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Check if we have an active session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!sessionData.session) {
        setPermissions(defaultPermissions);
        setIsAdmin(false);
        setIsMaster(false);
        setLoading(false);
        return;
      }
      
      const currentUserId = sessionData.session.user.id;
      setUserId(currentUserId);
      
      // Check if master user by email
      const userEmail = sessionData.session.user.email;
      if (userEmail === 'fabiano@totalseguranca.net') {
        console.log("User identified as master by email");
        setIsAdmin(true);
        setIsMaster(true);
        
        // Grant all permissions
        const allPermissions: UserPermissions = Object.keys(defaultPermissions).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as UserPermissions
        );
        
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }
      
      // Use direct RPC call to avoid recursion issues
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        user_id: currentUserId
      }) as { data: UserRoleData, error: any };
      
      if (roleError) {
        console.error("Error getting user role:", roleError);
        
        // Fallback in case RPC fails - direct SQL query
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('is_admin, is_master, cpf')
            .eq('id', currentUserId)
            .single();
          
          if (userError) throw userError;
          
          // Check if user is master
          const userIsMaster = isMasterUser(userData);
          
          setIsAdmin(userData.is_admin || userIsMaster);
          setIsMaster(userIsMaster);
          
          if (userIsMaster) {
            // Grant all permissions to master
            const allPermissions: UserPermissions = Object.keys(defaultPermissions).reduce(
              (acc, key) => ({ ...acc, [key]: true }),
              {} as UserPermissions
            );
            setPermissions(allPermissions);
            setLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
          // Continue to attempt loading permissions
        }
      } else if (roleData) {
        // Fix here: roleData is an object with properties is_admin and is_master, not an array
        const userIsAdmin = roleData.is_admin === true;
        const userIsMaster = roleData.is_master === true;
        
        setIsAdmin(userIsAdmin);
        setIsMaster(userIsMaster);
        
        if (userIsMaster) {
          // Grant all permissions to master
          const allPermissions: UserPermissions = Object.keys(defaultPermissions).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {} as UserPermissions
          );
          
          setPermissions(allPermissions);
          setLoading(false);
          return;
        }
      }
      
      // Get specific user permissions
      try {
        const { data: userPermissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', currentUserId)
          .maybeSingle();
        
        if (permissionsError) {
          throw permissionsError;
        }
        
        // Combine default permissions with those from the database
        if (userPermissions) {
          // Filter only boolean properties, ignoring 'id', 'user_id', etc.
          const filteredPermissions: UserPermissions = { ...defaultPermissions };
          
          // Process only valid properties that are in defaultPermissions or start with "can_"
          Object.keys(userPermissions).forEach(key => {
            if (key in defaultPermissions || key.startsWith('can_')) {
              // Ensure we assign only boolean values
              filteredPermissions[key] = Boolean(userPermissions[key]);
            }
          });
          
          // If admin, add administrative permissions
          if (isAdmin) {
            filteredPermissions.can_create_user = true;
            filteredPermissions.can_edit_user = true;
            filteredPermissions.can_edit_user_status = true;
            filteredPermissions.can_set_user_permissions = true;
            filteredPermissions.can_edit_document_type = true;
          }
          
          setPermissions(filteredPermissions);
        } else if (isAdmin) {
          // If admin but no permissions found, set basic admin permissions
          const adminPermissions = { ...defaultPermissions };
          adminPermissions.can_create_user = true;
          adminPermissions.can_edit_user = true;
          adminPermissions.can_edit_user_status = true;
          adminPermissions.can_set_user_permissions = true;
          adminPermissions.can_edit_document_type = true;
          adminPermissions.can_view = true;
          setPermissions(adminPermissions);
        }
      } catch (permError) {
        console.error("Error loading permissions:", permError);
        
        // Use basic permissions if admin or master
        if (isAdmin || isMaster) {
          const basicAdminPerms = { ...defaultPermissions };
          basicAdminPerms.can_create_user = true;
          basicAdminPerms.can_edit_user = true;
          basicAdminPerms.can_edit_user_status = true;
          basicAdminPerms.can_set_user_permissions = true;
          basicAdminPerms.can_edit_document_type = true;
          basicAdminPerms.can_view = true;
          setPermissions(basicAdminPerms);
        }
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const timeout = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${timeout}ms (attempt ${retryCount + 1})...`);
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          loadPermissions();
        }, timeout);
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao carregar permissões",
          description: "Não foi possível carregar suas permissões de acesso. Tente recarregar a página."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    // Check if permission exists and is enabled
    if (isMaster) return true; // Master user has all permissions
    return permissions[permission] === true;
  };

  // Function to force permissions update
  const refreshPermissions = async () => {
    setRetryCount(0);
    await loadPermissions();
  };

  // Load permissions on initialization
  useEffect(() => {
    loadPermissions();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setRetryCount(0);
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

// Hook for using permissions
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
