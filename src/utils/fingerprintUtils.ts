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
      
      // If profile exists, update it or create new one
      if (existingProfile) {
        // Check if we already have a fingerprint array
        let fingerprints = existingProfile.fingerprints || [];
        
        // Add new fingerprint to the array
        fingerprints.push({
          image: fingerprintData.image,
          index: fingerprintData.index,
          timestamp: fingerprintData.timestamp
        });
        
        // Keep only up to 10 fingerprints
        if (fingerprints.length > 10) {
          fingerprints = fingerprints.slice(0, 10);
        }
        
        // Update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: fingerprintData.name,
            role: fingerprintData.role,
            fingerprints: fingerprints,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);
        
        if (updateError) {
          console.error("Error updating profile with fingerprint:", updateError);
          return { success: false, error: updateError };
        }
      } else {
        // Create new profile with fingerprint
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: sessionData.session.user.id,
            name: fingerprintData.name,
            cpf: fingerprintData.cpf,
            role: fingerprintData.role,
            fingerprints: [{
              image: fingerprintData.image,
              index: fingerprintData.index,
              timestamp: fingerprintData.timestamp
            }],
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error creating profile with fingerprint:", insertError);
          return { success: false, error: insertError };
        }
      }
      
      console.log("Fingerprint saved successfully to Supabase");
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
    
    // Try to load from Supabase if connected
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData || !sessionData.session) {
      console.log("No active session, returning only local fingerprints");
      return filteredLocalFingerprints;
    }
    
    // Query to get profiles with fingerprints
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('fingerprints', null);
    
    // Add CPF filter if provided
    if (cpf) {
      query = query.eq('cpf', cpf);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // Check if it's a relation does not exist error
      if (error.code === 'PGSQL_RELATION_DOES_NOT_EXIST') {
        console.log("Profiles table doesn't exist yet, using local data");
        return filteredLocalFingerprints;
      }
      
      console.error("Error loading fingerprints from Supabase:", error);
      return filteredLocalFingerprints;
    }
    
    if (!data || data.length === 0) {
      console.log("No profiles with fingerprints found");
      return filteredLocalFingerprints;
    }
    
    // Convert Supabase data to the expected format
    const supabaseFingerprints: FingerprintRegistration[] = [];
    
    for (const profile of data) {
      if (profile.fingerprints && Array.isArray(profile.fingerprints)) {
        for (const fingerprint of profile.fingerprints) {
          supabaseFingerprints.push({
            image: fingerprint.image,
            name: profile.name,
            cpf: profile.cpf,
            role: profile.role,
            index: fingerprint.index,
            timestamp: fingerprint.timestamp,
            userId: profile.id
          });
        }
      }
    }
    
    console.log(`Found ${supabaseFingerprints.length} fingerprints in Supabase`);
    
    // Combine with local fingerprints, giving precedence to Supabase data
    const allFingerprints = [...supabaseFingerprints];
    
    // Add local fingerprints that don't match any in Supabase
    for (const localFp of filteredLocalFingerprints) {
      const exists = supabaseFingerprints.some(
        sbFp => sbFp.cpf === localFp.cpf && sbFp.index === localFp.index
      );
      
      if (!exists) {
        allFingerprints.push(localFp);
      }
    }
    
    return allFingerprints;
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
