
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for representing a face registration
 */
export interface FaceRegistration {
  image: string;
  name: string;
  role: string;
  timestamp: string;
  userId?: string; // Campo opcional para compatibilidade
}

/**
 * Registers a face in Supabase
 * @param faceData Face data to be registered
 * @returns Operation result
 */
export const registerFace = async (faceData: FaceRegistration): Promise<{success: boolean, error?: any}> => {
  try {
    console.log("Iniciando registro da face com dados:", { 
      nome: faceData.name, 
      cargo: faceData.role,
      tempoImagem: faceData.timestamp
    });
    
    if (!faceData.name || !faceData.role) {
      console.error("Nome ou cargo não fornecidos para registro facial");
      return { success: false, error: "Nome e cargo são obrigatórios" };
    }
    
    if (!faceData.image) {
      console.error("Imagem não fornecida para registro facial");
      return { success: false, error: "Imagem é obrigatória" };
    }
    
    // Verificar se estamos logados
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData && sessionData.session) {
      console.log("Usuário autenticado, salvando no perfil");
      // Update or insert the profile with face data
      const { error } = await supabase
        .from('profiles')
        .update({
          face_image: faceData.image,
          name: faceData.name,
          role: faceData.role,
          is_face_registered: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionData.session.user.id);
      
      if (error) {
        console.error("Erro ao salvar face no Supabase:", error);
        return { success: false, error };
      } else {
        console.log("Face salva com sucesso no Supabase");
        return { success: true };
      }
    } else {
      console.log("Usuário não autenticado, salvando localmente");
      // Salvar apenas localmente
      const storedFaces = localStorage.getItem('registeredFaces');
      let faces: FaceRegistration[] = storedFaces ? JSON.parse(storedFaces) : [];
      
      // Adicionar a nova face
      faces.push(faceData);
      
      // Salvar de volta no localStorage
      localStorage.setItem('registeredFaces', JSON.stringify(faces));
      
      console.log("Face salva localmente com sucesso");
      return { success: true };
    }
  } catch (error) {
    console.error("Erro ao registrar face:", error);
    return { success: false, error };
  }
};

/**
 * Loads registered faces
 * @returns Array of face registrations
 */
export const loadRegisteredFaces = async (): Promise<FaceRegistration[]> => {
  try {
    // Carregar faces do localStorage
    const storedFaces = localStorage.getItem('registeredFaces');
    const localFaces: FaceRegistration[] = storedFaces ? JSON.parse(storedFaces) : [];
    
    // Tentar carregar do Supabase se estiver conectado
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData || !sessionData.session) {
      console.log("Sem sessão ativa, retornando apenas faces locais");
      return localFaces;
    }
    
    // Buscar perfis com faces registradas
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_face_registered', true);
    
    if (error) {
      console.error("Erro ao carregar faces do Supabase:", error);
      return localFaces;
    }
    
    if (!data || data.length === 0) {
      console.log("Nenhum perfil com face registrada encontrado");
      return localFaces;
    }
    
    // Converter para o formato esperado
    const supabaseFaces = data
      .filter(profile => profile.face_image)
      .map(profile => ({
        image: profile.face_image || '',
        name: profile.name || '',
        role: profile.role || '',
        timestamp: profile.updated_at || new Date().toISOString(),
        userId: profile.id
      } as FaceRegistration));
    
    console.log(`Encontradas ${supabaseFaces.length} faces registradas no Supabase`);
    
    // Mesclar com faces locais, dando prioridade às do Supabase
    const allFaces = [...supabaseFaces];
    
    // Adicionar faces locais que não estão no Supabase
    for (const localFace of localFaces) {
      if (!supabaseFaces.some(face => face.image === localFace.image)) {
        allFaces.push(localFace);
      }
    }
    
    return allFaces;
  } catch (error) {
    console.error("Erro ao carregar faces registradas:", error);
    
    // Retornar faces locais como fallback
    const storedFaces = localStorage.getItem('registeredFaces');
    return storedFaces ? JSON.parse(storedFaces) : [];
  }
};

/**
 * Compares faces
 * Note: In a production environment, use a facial recognition API
 * like AWS Rekognition, Azure Face API, or a specific library
 * 
 * @param capturedImage Captured image for comparison
 * @param registeredFaces Array of registered faces
 * @returns Most similar face or null if not found
 */
export const compareFaces = (
  capturedImage: string,
  registeredFaces: FaceRegistration[]
): FaceRegistration | null => {
  // In a real system, this function would use a facial comparison algorithm
  // For this demo, we return the first registered face if available
  if (registeredFaces.length > 0) {
    console.log("Faces available for comparison:", registeredFaces.length);
    // Simulating a successful comparison
    return registeredFaces[0];
  }
  
  return null;
};

/**
 * Returns the Base64 code of any type of signature
 * @param signatureImage Signature image (can be drawing, face or fingerprint)
 * @returns String with the Base64 code
 */
export const getSignatureBase64 = (signatureImage: string): string => {
  // Checks if the image is already in base64 format
  if (signatureImage && signatureImage.startsWith('data:')) {
    return signatureImage;
  }
  
  // If not in base64 format, returns an empty string
  console.error("Signature image is not in base64 format");
  return '';
};
