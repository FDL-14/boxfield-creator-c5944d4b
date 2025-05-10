
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
  userId?: string; // Optional user ID for Supabase storage
}

/**
 * Load registered faces from storage
 */
export const loadRegisteredFaces = async (): Promise<FaceRegistration[]> => {
  try {
    // First try to load from Supabase if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData?.session?.user) {
      // User is authenticated, try to get faces from profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, cpf, role, face_image, is_face_registered, updated_at')
        .eq('is_face_registered', true)
        .not('face_image', 'is', null);
      
      if (!error && profiles && profiles.length > 0) {
        console.log("Loaded faces from Supabase:", profiles.length);
        
        // Map profiles to FaceRegistration format
        const faces: FaceRegistration[] = profiles.map(profile => ({
          name: profile.name || 'Usuário',
          cpf: profile.cpf || '',
          role: profile.role || 'Usuário',
          image: profile.face_image || '',
          timestamp: profile.updated_at || new Date().toISOString(),
          userId: profile.id
        }));
        
        // Also store in local storage as backup
        localStorage.setItem('registeredFaces', JSON.stringify(faces));
        
        return faces;
      }
    }
    
    // If Supabase fail or user not authenticated, load from local storage
    const stored = localStorage.getItem('registeredFaces');
    const faces = stored ? JSON.parse(stored) : [];
    
    return faces;
  } catch (error) {
    console.error("Error loading registered faces:", error);
    
    // Fallback to local storage in case of error
    try {
      const stored = localStorage.getItem('registeredFaces');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
};

/**
 * Save a face registration
 */
export const saveFaceRegistration = async (faceData: FaceRegistration): Promise<boolean> => {
  try {
    // Get current faces from storage
    const faces = await loadRegisteredFaces();
    
    // Add new face with timestamp
    const newFace = {
      ...faceData,
      timestamp: new Date().toISOString()
    };
    
    // Add to the list
    const updatedFaces = [...faces, newFace];
    
    // Save to local storage
    localStorage.setItem('registeredFaces', JSON.stringify(updatedFaces));
    
    // Try to save to Supabase if user is authenticated
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        // User is authenticated, try to update their profile
        const { error } = await supabase
          .from('profiles')
          .update({
            face_image: faceData.image,
            is_face_registered: true,
            role: faceData.role || 'Usuário',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionData.session.user.id);
        
        if (error) {
          console.error("Error saving face to Supabase:", error);
        } else {
          console.log("Face saved to Supabase successfully");
        }
      }
    } catch (supabaseError) {
      console.error("Error saving to Supabase:", supabaseError);
      // Continue - we already saved to localStorage
    }
    
    return true;
  } catch (error) {
    console.error("Error saving face registration:", error);
    return false;
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
