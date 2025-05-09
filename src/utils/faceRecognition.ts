
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
 * Compare a captured face against registered faces
 * @param capturedImage The face image to compare
 * @param registeredFaces Array of registered faces to compare against
 * @returns Matched face registration or null if not found
 */
export const compareFaces = (capturedImage: string, registeredFaces: FaceRegistration[]): FaceRegistration | null => {
  try {
    console.log(`Comparing face against ${registeredFaces.length} registered faces`);
    
    // In a real implementation, this would use facial recognition algorithms
    // For this demo we'll simulate a match with the first face
    if (registeredFaces.length > 0) {
      console.log("Simulating a match with:", registeredFaces[0].name);
      return registeredFaces[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error comparing faces:", error);
    return null;
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
    
    // Compare the face using our comparison function
    return compareFaces(faceImage, faces);
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
