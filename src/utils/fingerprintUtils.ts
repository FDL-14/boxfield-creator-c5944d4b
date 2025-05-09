
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Interface for fingerprint registration
 */
export interface FingerprintRegistration {
  image: string;
  name: string;
  cpf: string;
  role: string;
  index: number;
  timestamp: string;
  userId?: string;
}

/**
 * Register a fingerprint in the Supabase database
 * @param fingerprintData Fingerprint data to be registered
 * @returns Result of the operation
 */
export const registerFingerprint = async (fingerprintData: FingerprintRegistration): Promise<{success: boolean, error?: any}> => {
  try {
    console.log("Registering fingerprint for:", {
      name: fingerprintData.name,
      cpf: fingerprintData.cpf,
      role: fingerprintData.role,
      index: fingerprintData.index
    });
    
    if (!fingerprintData.name || !fingerprintData.cpf || !fingerprintData.role) {
      console.error("Missing required data for fingerprint registration");
      return { success: false, error: "Dados obrigatórios não fornecidos" };
    }
    
    if (!fingerprintData.image) {
      console.error("No fingerprint image provided");
      return { success: false, error: "Imagem da digital é obrigatória" };
    }
    
    // Verify if we're logged in
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData && sessionData.session) {
      console.log("User authenticated, saving to profile");
      
      // Check if profile exists already
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', fingerprintData.cpf)
        .single();
      
      if (profileError && profileError.code !== 'PGSQL_RELATION_DOES_NOT_EXIST') {
        // If error is not about table not existing, handle it
        if (profileError.code !== 'PGSQL_NO_ROWS_RETURNED') {
          console.error("Error checking profile:", profileError);
          return { success: false, error: profileError };
        }
      }
      
      // For local storage fallback
      // Save locally in localStorage
      const storedFingerprints = localStorage.getItem('registeredFingerprints');
      let fingerprints: FingerprintRegistration[] = storedFingerprints ? JSON.parse(storedFingerprints) : [];
      
      // Add the new fingerprint
      fingerprints.push(fingerprintData);
      
      // Save back to localStorage
      localStorage.setItem('registeredFingerprints', JSON.stringify(fingerprints));
      
      console.log("Fingerprint saved locally as fallback");
      return { success: true };
    } else {
      console.log("User not authenticated, saving locally");
      
      // Save locally in localStorage
      const storedFingerprints = localStorage.getItem('registeredFingerprints');
      let fingerprints: FingerprintRegistration[] = storedFingerprints ? JSON.parse(storedFingerprints) : [];
      
      // Add the new fingerprint
      fingerprints.push(fingerprintData);
      
      // Save back to localStorage
      localStorage.setItem('registeredFingerprints', JSON.stringify(fingerprints));
      
      console.log("Fingerprint saved locally");
      return { success: true };
    }
  } catch (error) {
    console.error("Error registering fingerprint:", error);
    return { success: false, error };
  }
};

/**
 * Load registered fingerprints
 * @param cpf Optional CPF to filter fingerprints by person
 * @returns Array of fingerprint registrations
 */
export const loadRegisteredFingerprints = async (cpf?: string): Promise<FingerprintRegistration[]> => {
  try {
    // Load from localStorage
    const storedFingerprints = localStorage.getItem('registeredFingerprints');
    const localFingerprints: FingerprintRegistration[] = storedFingerprints ? JSON.parse(storedFingerprints) : [];
    
    // Filter by CPF if provided
    const filteredLocalFingerprints = cpf 
      ? localFingerprints.filter(fp => fp.cpf === cpf)
      : localFingerprints;
    
    // Return local fingerprints for now until we have proper DB structure
    return filteredLocalFingerprints;
  } catch (error) {
    console.error("Error loading registered fingerprints:", error);
    
    // Return local fingerprints as fallback
    const storedFingerprints = localStorage.getItem('registeredFingerprints');
    const localFingerprints: FingerprintRegistration[] = storedFingerprints ? JSON.parse(storedFingerprints) : [];
    
    return cpf ? localFingerprints.filter(fp => fp.cpf === cpf) : localFingerprints;
  }
};

/**
 * Compare a captured fingerprint against registered fingerprints
 * @param capturedFingerprint The fingerprint to verify
 * @returns Matched fingerprint data or null if not found
 */
export const verifyFingerprint = async (capturedFingerprint: string): Promise<FingerprintRegistration | null> => {
  try {
    // Load all registered fingerprints
    const registeredFingerprints = await loadRegisteredFingerprints();
    
    if (registeredFingerprints.length === 0) {
      console.log("No registered fingerprints found for verification");
      return null;
    }
    
    // In a real implementation, this would use a fingerprint matching algorithm
    // For this demo, we'll simulate a match with the first fingerprint
    console.log(`Simulating verification against ${registeredFingerprints.length} fingerprints`);
    
    // Return the first fingerprint as a simulated match
    if (registeredFingerprints.length > 0) {
      console.log("Simulated match found:", registeredFingerprints[0].name);
      return registeredFingerprints[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error verifying fingerprint:", error);
    return null;
  }
};

/**
 * Get Base64 code from fingerprint image
 * @param fingerprintImage Fingerprint image in base64 format
 * @returns Base64 string
 */
export const getFingerprintBase64 = (fingerprintImage: string): string => {
  return fingerprintImage;
};
