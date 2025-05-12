
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço responsável por gerenciar mídias (imagens, assinaturas)
 */
export const MediaService = {
  /**
   * Captura imagem da câmera
   * @param facingMode 'user' para câmera frontal, 'environment' para câmera traseira
   * @returns Promise com o elemento de video e stream da câmera
   */
  startCamera: async (facingMode: 'user' | 'environment' = 'user'): Promise<{
    videoElement: HTMLVideoElement | null,
    stream: MediaStream | null,
    error: string | null
  }> => {
    try {
      // Verificar se a API de mídia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("API de mídia não disponível neste navegador");
      }
      
      // Criar elemento de vídeo
      const videoElement = document.createElement('video');
      videoElement.setAttribute('autoplay', 'true');
      videoElement.setAttribute('playsinline', 'true');
      
      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      // Conectar stream ao elemento de vídeo
      videoElement.srcObject = stream;
      
      return {
        videoElement,
        stream,
        error: null
      };
    } catch (error: any) {
      console.error("Erro ao iniciar câmera:", error);
      return {
        videoElement: null,
        stream: null,
        error: error.message || "Falha ao acessar câmera"
      };
    }
  },
  
  /**
   * Para a câmera e libera recursos
   * @param stream Stream da câmera a ser interrompido
   */
  stopCamera: (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  },
  
  /**
   * Alterna entre câmera frontal e traseira
   * @param currentFacingMode Modo atual da câmera
   * @param currentStream Stream atual da câmera (será fechado)
   * @returns Novo stream e elemento de vídeo
   */
  switchCamera: async (
    currentFacingMode: 'user' | 'environment',
    currentStream: MediaStream | null
  ) => {
    // Primeiro para a câmera atual
    MediaService.stopCamera(currentStream);
    
    // Inicia com o modo oposto
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return MediaService.startCamera(newFacingMode);
  },
  
  /**
   * Captura um frame da câmera como imagem base64
   * @param videoElement Elemento de vídeo da câmera
   * @returns String base64 da imagem capturada
   */
  captureImage: (videoElement: HTMLVideoElement): string => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Não foi possível criar contexto de canvas");
      
      // Desenhar o frame do vídeo no canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Converter para base64
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      return imageDataUrl;
    } catch (error: any) {
      console.error("Erro ao capturar imagem:", error);
      return '';
    }
  },
  
  /**
   * Redimensiona uma imagem base64
   * @param base64Image Imagem em formato base64
   * @param maxWidth Largura máxima
   * @param maxHeight Altura máxima
   * @returns Imagem redimensionada em base64
   */
  resizeImage: async (
    base64Image: string,
    maxWidth: number = 800,
    maxHeight: number = 600
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Calcular as dimensões mantendo a proporção
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // Criar canvas para redimensionamento
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Desenhar imagem redimensionada
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Erro ao criar contexto de canvas");
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para base64 com qualidade reduzida
          const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
          resolve(resizedImage);
        };
        
        img.onerror = () => {
          reject(new Error("Erro ao carregar imagem"));
        };
        
        img.src = base64Image;
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * Salva uma imagem no armazenamento do Supabase
   * @param base64Image Imagem em formato base64
   * @param path Caminho para salvamento (pasta)
   * @param name Nome do arquivo (opcional)
   * @returns URL da imagem salva
   */
  uploadImage: async (
    base64Image: string,
    path: string,
    name?: string
  ): Promise<{url: string | null, error: string | null}> => {
    try {
      // Converter base64 para blob
      const base64Response = await fetch(base64Image);
      const blob = await base64Response.blob();
      
      // Criar nome de arquivo único
      const fileName = name || `${uuidv4()}.jpg`;
      const filePath = `${path}/${fileName}`;
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) throw error;
      
      // Obter URL pública
      const { data: urlData } = supabase
        .storage
        .from('images')
        .getPublicUrl(filePath);
      
      return { url: urlData.publicUrl, error: null };
    } catch (error: any) {
      console.error("Erro ao fazer upload de imagem:", error);
      return { url: null, error: error.message };
    }
  },
  
  /**
   * Converte uma assinatura para formato base64
   * @param signatureData Dados da assinatura
   * @returns String base64 da assinatura
   */
  convertSignatureToBase64: (signatureData: any): string => {
    if (!signatureData) return '';
    
    // Se já for uma string base64
    if (typeof signatureData === 'string' && signatureData.startsWith('data:')) {
      return signatureData;
    }
    
    try {
      // Para assinaturas em formato de pontos
      if (Array.isArray(signatureData) || (signatureData.points && Array.isArray(signatureData.points))) {
        const points = Array.isArray(signatureData) ? signatureData : signatureData.points;
        
        // Criar canvas para desenhar a assinatura
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Erro ao criar contexto de canvas");
        
        // Configurações de desenho
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Desenhar os pontos como linhas
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          
          if (i === 0 || point.newStroke) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        
        ctx.stroke();
        
        // Converter para base64
        return canvas.toDataURL('image/png');
      }
      
      // Outros formatos não suportados
      return '';
    } catch (error) {
      console.error("Erro ao converter assinatura para base64:", error);
      return '';
    }
  }
};
