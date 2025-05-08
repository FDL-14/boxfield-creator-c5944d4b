
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface para representar um cadastro de face
 */
export interface FaceRegistration {
  image: string;
  name: string;
  role: string;
  timestamp: string;
  userId?: string; // Tornar opcional para compatibilidade
}

/**
 * Registra uma face no Supabase
 * @param faceData Dados da face a ser registrada
 * @returns Resultado da operação
 */
export const registerFace = async (faceData: FaceRegistration): Promise<{success: boolean, error?: any}> => {
  try {
    // Verificar se estamos logados
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData && sessionData.session) {
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
      // Salvar apenas localmente
      const storedFaces = localStorage.getItem('registeredFaces');
      let faces: FaceRegistration[] = storedFaces ? JSON.parse(storedFaces) : [];
      
      // Adicionar a nova face
      faces.push(faceData);
      
      // Salvar de volta no localStorage
      localStorage.setItem('registeredFaces', JSON.stringify(faces));
      
      return { success: true };
    }
  } catch (error) {
    console.error("Erro ao registrar face:", error);
    return { success: false, error };
  }
};

/**
 * Carrega faces registradas
 * @returns Array de registros de faces
 */
export const loadRegisteredFaces = async (): Promise<FaceRegistration[]> => {
  try {
    // Carregar faces do localStorage
    const storedFaces = localStorage.getItem('registeredFaces');
    const localFaces: FaceRegistration[] = storedFaces ? JSON.parse(storedFaces) : [];
    
    // Tentar carregar do Supabase se estiver conectado
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData || !sessionData.session) {
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
 * Função simples para comparar faces
 * Nota: Em um ambiente de produção, deve-se usar uma API de reconhecimento facial
 * como AWS Rekognition, Azure Face API, ou uma biblioteca específica
 * 
 * @param capturedImage Imagem capturada para comparação
 * @param registeredFaces Array de faces registradas
 * @returns Face mais similar ou null se não encontrada
 */
export const compareFaces = (
  capturedImage: string,
  registeredFaces: FaceRegistration[]
): FaceRegistration | null => {
  // Em um sistema real, esta função usaria um algoritmo de comparação facial
  // Para esta demonstração, retornamos a primeira face registrada se houver
  if (registeredFaces.length > 0) {
    // Simulando uma comparação bem-sucedida
    return registeredFaces[0];
  }
  
  return null;
};
