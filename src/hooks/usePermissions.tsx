
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

// Permissions provider
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to check if it's the master user
  const checkIfMaster = (profile: any): boolean => {
    if (!profile) return false;
    
    // First check email (more reliable for identification)
    if (profile.email === 'fabiano@totalseguranca.net') {
      console.log("Master identified by email");
      return true;
    }
    
    // Then check CPF
    const masterCPF = '80243088191';
    const userCPF = profile.cpf ? profile.cpf.replace(/\D/g, '') : '';
    
    if (userCPF === masterCPF || profile.is_master === true) {
      console.log("Master identified by CPF or flag");
      return true;
    }
    
    return false;
  };

  // Load current user permissions
  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Check if we have an active session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error retrieving session:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        console.log("No active session found");
        setPermissions(defaultPermissions);
        setIsAdmin(false);
        setIsMaster(false);
        setLoading(false);
        return;
      }
      
      const userId = sessionData.session.user.id;
      console.log("Loading permissions for user:", userId);
      
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
      
      try {
        // Get user profile with error handling
        console.log("Fetching user profile");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // Special handling for infinite recursion error
          if (profileError.code === '42P17') {
            console.log("Recursion error detected, using default profile");
            
            // If recursion error, create a basic profile
            const defaultProfile = {
              id: userId,
              is_admin: false,
              is_master: false
            };
            
            // Check if master user to give admin access
            if (userEmail === 'fabiano@totalseguranca.net') {
              defaultProfile.is_master = true;
              defaultProfile.is_admin = true;
            }
            
            // Use this default profile
            await handleUserProfile(defaultProfile);
          } else {
            throw profileError;
          }
        } else {
          // If no error, process the profile normally
          await handleUserProfile(profile);
        }
      } catch (profileFetchError) {
        console.error("Error fetching profile:", profileFetchError);
        
        // Try using a minimal profile with email check
        const userEmail = sessionData.session.user.email;
        const isMasterByEmail = userEmail === 'fabiano@totalseguranca.net';
        
        if (isMasterByEmail) {
          console.log("Using minimal profile with master status by email");
          const minimalProfile = {
            id: userId,
            email: userEmail,
            is_admin: true,
            is_master: true
          };
          
          await handleUserProfile(minimalProfile);
        } else {
          setPermissions(defaultPermissions);
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Error loading permissions:", error);
      toast({
        variant: "destructive",
        title: "Error loading permissions",
        description: "Could not load your access permissions."
      });
      setPermissions(defaultPermissions);
      setLoading(false);
    }
  };
  
  // Function to process user profile and set permissions
  const handleUserProfile = async (profile: any) => {
    try {
      console.log("Processing user profile:", profile);
      
      // Check if admin or master
      const userIsAdmin = profile.is_admin === true;
      const userIsMaster = checkIfMaster(profile);
      
      setIsAdmin(userIsAdmin);
      setIsMaster(userIsMaster);
      
      console.log("User is admin:", userIsAdmin);
      console.log("User is master:", userIsMaster);
      
      // If master, grant all permissions
      if (userIsMaster) {
        console.log("Granting all permissions to master user");
        
        const allPermissions: UserPermissions = Object.keys(defaultPermissions).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as UserPermissions
        );
        
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }
      
      // Get specific user permissions
      console.log("Fetching specific user permissions");
      const { data: userPermissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (permissionsError && permissionsError.code !== 'PGRST116') {
        console.error("Error fetching permissions:", permissionsError);
        throw permissionsError;
      }
      
      // Combine default permissions with those from the database
      if (userPermissions) {
        console.log("Permissions found for user:", userPermissions);
        
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
        if (userIsAdmin) {
          console.log("Adding administrative permissions");
          filteredPermissions.can_create_user = true;
          filteredPermissions.can_edit_user = true;
          filteredPermissions.can_edit_user_status = true;
          filteredPermissions.can_set_user_permissions = true;
          filteredPermissions.can_edit_document_type = true;
        }
        
        console.log("Final permissions set:", filteredPermissions);
        setPermissions(filteredPermissions);
      } else {
        console.log("No specific permissions found, using default");
        
        // If admin but no permissions, set basic admin permissions
        if (userIsAdmin) {
          const adminPermissions = { ...defaultPermissions };
          adminPermissions.can_create_user = true;
          adminPermissions.can_edit_user = true;
          adminPermissions.can_edit_user_status = true;
          adminPermissions.can_set_user_permissions = true;
          adminPermissions.can_edit_document_type = true;
          adminPermissions.can_view = true;
          setPermissions(adminPermissions);
        } else {
          setPermissions(defaultPermissions);
        }
      }
    } catch (error) {
      console.error("Error processing user profile:", error);
      setPermissions(defaultPermissions);
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
    await loadPermissions();
  };

  // Load permissions on initialization
  useEffect(() => {
    console.log("Initializing PermissionsProvider");
    loadPermissions();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("User authenticated or token renewed, reloading permissions");
          loadPermissions();
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out, resetting permissions");
          setPermissions(defaultPermissions);
          setIsAdmin(false);
          setIsMaster(false);
        }
      }
    );
    
    return () => {
      console.log("Cleaning up PermissionsProvider");
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
