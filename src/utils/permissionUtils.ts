
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
    
    // First check if user is admin or master directly via profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, is_master, cpf')
      .eq('id', userId)
      .maybeSingle();
    
    // If user is admin or master, they have all permissions
    if (!profileError && profileData) {
      const isSpecialMaster = profileData.cpf === '80243088191';
      if (profileData.is_master === true || isSpecialMaster || profileData.is_admin === true) {
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
    const { data, error } = await supabase
      .from('profiles')
      .select('is_master, cpf')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking master status:", error);
      return false;
    }
    
    // Special master user check by CPF
    const isSpecialMaster = data?.cpf === '80243088191';
    return (data?.is_master === true) || isSpecialMaster;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_master, cpf')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    // Special master users are also admins
    const isSpecialMaster = data?.cpf === '80243088191';
    return (data?.is_admin === true) || (data?.is_master === true) || isSpecialMaster;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
