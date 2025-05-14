/**
 * Utility functions for permission handling
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the current user has the specified permission
 * Uses optimized queries to prevent infinite recursion
 */
export const checkUserPermission = async (
  userId: string | undefined, 
  permission: string
): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    // Check if user is admin or master first via RPC
    const { data: roleData, error: roleError } = await supabase.rpc('check_user_role', {
      user_id: userId
    });
    
    // If user is admin or master, they have all permissions
    if (!roleError && roleData && roleData.length > 0) {
      if (roleData[0].is_master === true || roleData[0].is_admin === true) {
        return true;
      }
    }
    
    // Otherwise, check specific permission
    const { data: permissionData, error: permissionError } = await supabase
      .from('user_permissions')
      .select(permission)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (permissionError) {
      console.error("Permission check error:", permissionError);
      return false;
    }
    
    return permissionData && permissionData[permission] === true;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Checks if a user is a master user
 */
export const isMasterUser = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase.rpc('check_user_role', {
      user_id: userId
    });
    
    return !error && data && data.length > 0 && data[0].is_master === true;
  } catch (error) {
    console.error("Error checking master status:", error);
    return false;
  }
};

/**
 * Checks if a user is an admin
 */
export const isAdminUser = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase.rpc('check_user_role', {
      user_id: userId
    });
    
    return !error && data && data.length > 0 && data[0].is_admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
