
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for fingerprint registration data
 */
export interface FingerprintRegistration {
  name: string;
  cpf: string;
  role: string;
  template: string; // Changed from 'fingerprint' to 'template' to fix the error
  finger: string;
  timestamp: string;
  userId?: string;
}

/**
 * Load registered fingerprints from storage
 */
export const loadRegisteredFingerprints = async (): Promise<FingerprintRegistration[]> => {
  try {
    // First try to load from Supabase if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData?.session?.user) {
      // User is authenticated, try to get fingerprints from a Supabase table
      // This is just a placeholder - implement according to your actual DB schema
      console.log("User is authenticated, could load fingerprints from Supabase");
    }
    
    // For now, we'll load from local storage as demo
    const stored = localStorage.getItem('registeredFingerprints');
    const prints = stored ? JSON.parse(stored) : [];
    
    return prints;
  } catch (error) {
    console.error("Error loading registered fingerprints:", error);
    return [];
  }
};

/**
 * Save a fingerprint registration
 */
export const saveFingerprintRegistration = async (fingerprintData: FingerprintRegistration): Promise<boolean> => {
  try {
    // Get current fingerprints from storage
    const prints = await loadRegisteredFingerprints();
    
    // Add timestamp if not provided
    const newPrint = {
      ...fingerprintData,
      timestamp: fingerprintData.timestamp || new Date().toISOString()
    };
    
    // Add to the list
    const updatedPrints = [...prints, newPrint];
    
    // Save back to storage
    localStorage.setItem('registeredFingerprints', JSON.stringify(updatedPrints));
    
    // TODO: Save to Supabase if user is authenticated
    // This would be implemented according to your DB schema
    
    return true;
  } catch (error) {
    console.error("Error saving fingerprint registration:", error);
    return false;
  }
};

/**
 * Register a new fingerprint
 * @param fingerprint - The fingerprint data to register
 * @returns boolean - Success status
 */
export const registerFingerprint = async (fingerprint: {
  image: string;
  name: string;
  cpf: string;
  role: string;
  index: number;
  timestamp: string;
}): Promise<boolean> => {
  try {
    const fingerprintData: FingerprintRegistration = {
      name: fingerprint.name,
      cpf: fingerprint.cpf,
      role: fingerprint.role,
      template: fingerprint.image, // Using the image as template
      finger: `Finger ${fingerprint.index + 1}`, // Converting index to finger name
      timestamp: fingerprint.timestamp
    };

    return await saveFingerprintRegistration(fingerprintData);
  } catch (error) {
    console.error("Error registering fingerprint:", error);
    return false;
  }
};

/**
 * Verify a fingerprint template against registered prints
 * @param fingerprintTemplate - The captured fingerprint template to verify
 * @returns Matched fingerprint registration or null if not found
 */
export const verifyFingerprint = async (fingerprintTemplate: string): Promise<FingerprintRegistration | null> => {
  try {
    // Load registered fingerprints
    const prints = await loadRegisteredFingerprints();
    
    // In a real implementation, this would use a fingerprint matching algorithm
    // For this demo we'll simulate a match with the first fingerprint
    if (prints.length > 0) {
      return prints[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error verifying fingerprint:", error);
    return null;
  }
};
