
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const supabase = createClient<Database>(
  "https://tsjdsbxgottssqqlzfxl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamRzYnhnb3R0c3NxcWx6ZnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODM3NDgsImV4cCI6MjA2MDE1OTc0OH0.3WVd3cIBxyUlJGBjCzwLs5YY14xC6ZNtMbb5zuxF0EY",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'supabase_auth_token',
      storage: localStorage
    }
  }
);

// Helper to process user profile
export function processUserProfile(profile: any): any {
  if (!profile) return null;
  
  // Create a deep copy to avoid modifying the original object
  const processedProfile = {
    ...profile,
    // Ensure boolean values are properly set
    is_admin: profile.is_admin === true,
    is_master: profile.is_master === true || isMasterUser(profile),
    is_face_registered: profile.is_face_registered === true,
    // Initialize arrays if they don't exist or aren't arrays
    company_ids: Array.isArray(profile.company_ids) ? profile.company_ids : [],
    client_ids: Array.isArray(profile.client_ids) ? profile.client_ids : [],
    // Process permissions correctly - ensure it's always an array
    permissions: profile.permissions ? 
      (Array.isArray(profile.permissions) ? profile.permissions : [profile.permissions]) : 
      []
  };

  return processedProfile;
}

// Helper to clean CPF
export function cleanCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}

// Helper to check if user is master user
export function isMasterUser(profile: any): boolean {
  if (!profile) return false;
  
  // Check if user is master by CPF, email or flag
  const masterCPF = '80243088191';
  const userCPF = cleanCPF(profile.cpf);
  const isMasterByEmail = profile.email === 'fabiano@totalseguranca.net';
  const isMasterByFlag = profile.is_master === true;
  
  return userCPF === masterCPF || isMasterByFlag || isMasterByEmail;
}

// Helper function to initialize master user through edge function
export async function ensureMasterUserInitialized() {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      // Verify if user exists first to avoid extra calls
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, email, cpf, is_master')
        .eq('id', session.session.user.id)
        .maybeSingle();

      if (userData?.email === 'fabiano@totalseguranca.net' || 
          cleanCPF(userData?.cpf) === '80243088191' || 
          userData?.is_master === true) {
        console.log("Initializing master user...");
        const { error } = await supabase.functions.invoke('init-master-user', {});
        if (error) {
          console.error("Error initializing master user:", error);
        } else {
          console.log("Master user initialized successfully");
        }
      }
    }
  } catch (error) {
    console.error("Error in ensureMasterUserInitialized:", error);
  }
}

// Function to retry getting profile with exponential backoff
export async function getProfileWithRetry(userId: string, maxRetries = 3): Promise<any> {
  let retries = 0;
  let lastError = null;

  while (retries < maxRetries) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) return processUserProfile(data);
      
      // If no data but no error, wait and retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      retries++;
    } catch (error) {
      console.error(`Error getting profile (attempt ${retries + 1}):`, error);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      retries++;
    }
  }

  // If we still don't have profile, try to create it
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      // Try to check if user already exists (avoiding duplicates)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (!existingProfile) {
        // User doesn't exist in profiles, try to create one
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: userData.user.id, 
              email: userData.user.email,
              name: userData.user.user_metadata?.name || 'Novo Usuário',
              role: 'user',
              is_admin: false,
              is_master: false,
              company_ids: [],
              client_ids: []
            }
          ])
          .select('*')
          .single();

        if (createError) throw createError;
        if (createdProfile) return processUserProfile(createdProfile);
      }
    }
  } catch (error) {
    console.error("Error creating profile:", error);
  }

  throw new Error(`Failed to get profile after ${maxRetries} attempts. Last error: ${lastError}`);
}
