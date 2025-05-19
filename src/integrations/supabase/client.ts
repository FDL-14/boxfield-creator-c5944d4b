
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const supabase = createClient<Database>(
  "https://tsjdsbxgottssqqlzfxl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamRzYnhnb3R0c3NxcWx6ZnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODM3NDgsImV4cCI6MjA2MDE1OTc0OH0.3WVd3cIBxyUlJGBjCzwLs5YY14xC6ZNtMbb5zuxF0EY"
);

// Helper to process user profile
export function processUserProfile(profile: any): any {
  if (!profile) return null;
  
  // Convert the profile to a reliable format
  const processedProfile = {
    ...profile,
    // Ensure boolean values are properly set
    is_admin: profile.is_admin === true,
    is_master: profile.is_master === true || isMasterUser(profile),
    is_face_registered: profile.is_face_registered === true,
    // Ensure arrays are initialized
    company_ids: Array.isArray(profile.company_ids) ? profile.company_ids : [],
    client_ids: Array.isArray(profile.client_ids) ? profile.client_ids : [],
    // Process nested permissions if present
    permissions: profile.permissions || []
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
  
  // Check if user is master by CPF or flag
  const masterCPF = '80243088191';
  const userCPF = cleanCPF(profile.cpf);
  const isMasterByEmail = profile.email === 'fabiano@totalseguranca.net';
  
  return userCPF === masterCPF || profile.is_master === true || isMasterByEmail;
}
