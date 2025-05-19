
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase, getProfileWithRetry, ensureMasterUserInitialized } from "@/integrations/supabase/client";

// Permission types
export interface UserPermissions {
  // Core permissions
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  
  // User permissions
  can_create_user: boolean;
  can_edit_user: boolean;
  can_edit_user_status: boolean;
  can_set_user_permissions: boolean;
  
  // Document permissions
  can_edit_document: boolean;
  can_edit_document_type: boolean;
  
  // Section permissions
  can_create_section: boolean;
  can_edit_section: boolean;
  can_delete_section: boolean;
  
  // Field permissions
  can_create_field: boolean;
  can_edit_field: boolean;
  can_delete_field: boolean;
  can_fill_field: boolean;
  
  // Content permissions
  can_sign: boolean;
  can_insert_logo: boolean;
  can_insert_photo: boolean;
  
  // Document operations
  can_save: boolean;
  can_save_as: boolean;
  can_download: boolean;
  can_open: boolean;
  can_print: boolean;
  
  // Action permissions
  can_edit_action: boolean;
  can_mark_complete: boolean;
  can_mark_delayed: boolean;
  can_add_notes: boolean;
  
  // Client/Company permissions
  can_edit_client: boolean;
  can_delete_client: boolean;
  can_edit_company: boolean;
  can_delete_company: boolean;
  
  // View permissions
  can_view: boolean;
  can_view_reports: boolean;
  view_all_actions: boolean;
  
  // Any additional custom permissions (for future-proofing)
  [key: string]: boolean;
}

// Modified to grant all permissions
const fullPermissions: UserPermissions = Object.keys(
  {
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_create_user: true,
    can_edit_user: true,
    can_edit_user_status: true,
    can_set_user_permissions: true,
    can_create_section: true,
    can_edit_section: true,
    can_delete_section: true,
    can_create_field: true,
    can_edit_field: true,
    can_delete_field: true,
    can_fill_field: true,
    can_sign: true,
    can_insert_logo: true,
    can_insert_photo: true,
    can_save: true,
    can_save_as: true,
    can_download: true,
    can_open: true,
    can_print: true,
    can_edit_document: true,
    can_edit_document_type: true,
    can_mark_complete: true,
    can_mark_delayed: true,
    can_add_notes: true,
    can_view_reports: true,
    can_view: true,
    can_edit_action: true,
    can_edit_client: true,
    can_delete_client: true,
    can_edit_company: true,
    can_delete_company: true,
    view_all_actions: true
  }
).reduce((acc, key) => ({ ...acc, [key]: true }), {} as UserPermissions);

// Permissions context
interface PermissionsContextType {
  permissions: UserPermissions;
  isAdmin: boolean;
  isMaster: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  checkPermission: (permission: keyof UserPermissions) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: fullPermissions,
  isAdmin: true,
  isMaster: true,
  isAuthenticated: true,
  loading: false,
  checkPermission: () => true,
  refreshPermissions: async () => {}
});

// Modified permissions provider to always grant access and permissions
export function PermissionsProvider({ children }: { children: ReactNode }) {
  // Always set full permissions, admin, master, and authenticated to true
  const [permissions] = useState<UserPermissions>(fullPermissions);
  const [isAdmin] = useState(true);
  const [isMaster] = useState(true);
  const [isAuthenticated] = useState(true);
  const [loading] = useState(false);

  // Check if user has a specific permission (always return true)
  const checkPermission = () => true;

  // Function to force permissions update
  const refreshPermissions = async () => {
    // No need to do anything, permissions are always granted
  };

  const value = {
    permissions,
    isAdmin,
    isMaster,
    isAuthenticated,
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
