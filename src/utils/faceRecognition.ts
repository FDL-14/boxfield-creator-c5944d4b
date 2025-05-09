
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for face registration
 */
export interface FaceRegistration {
  name: string;
  cpf: string;
  role: string;
  image: string;
  timestamp: string;
}

/**
 * Load registered faces from storage
 */
export const loadRegisteredFaces = async (): Promise<FaceRegistration[]> => {
  try {
    // First try to load from local storage
    const stored = localStorage.getItem('registeredFaces');
    const faces = stored ? JSON.parse(stored) : [];
    
    return faces;
  } catch (error) {
    console.error("Error loading registered faces:", error);
    return [];
  }
};

/**
 * Verify a face against registered faces
 * @param faceImage The captured face image to verify
 * @returns Matched face registration or null if not found
 */
export const verifyFace = async (faceImage: string): Promise<FaceRegistration | null> => {
  try {
    // Load registered faces
    const faces = await loadRegisteredFaces();
    
    // In a real implementation, this would use facial recognition
    // For this demo we'll simulate a match with the first face
    if (faces.length > 0) {
      return faces[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error verifying face:", error);
    return null;
  }
};

/**
 * Get Base64 signature from image
 */
export const getSignatureBase64 = (signatureImage: string): string => {
  return signatureImage || '';
};
