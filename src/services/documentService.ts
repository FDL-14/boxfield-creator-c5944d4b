
import { supabase } from "@/integrations/supabase/client";
import { saveFormData, getSavedForms } from "@/utils/formUtils";
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for document data structure
 */
interface DocumentData {
  id?: string;
  title?: string;
  description?: string;
  boxes?: any[];
  fields?: any[];
  export_format?: string;
  section_locks?: any[];
  created_by?: string | null;
  [key: string]: any;
}

/**
 * Serviço responsável por gerenciar documentos
 */
export const DocumentService = {
  /**
   * Salva um documento no Supabase
   */
  saveDocument: async (
    docType: string,
    title: string,
    data: any,
    isTemplate: boolean = false,
    exportFormat: string = 'PDF'
  ) => {
    try {
      console.log("Salvando documento no Supabase:", { docType, title, isTemplate, exportFormat });
      
      // Verificar se já temos uma sessão do usuário
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Preparar dados para salvar
      const userId = sessionData.session?.user?.id || data.created_by || null;
      const documentId = data.id || uuidv4();
      
      // Adicionar ID à cópia dos dados
      const docDataWithId: DocumentData = {
        ...data,
        id: documentId,
        export_format: exportFormat,
        // Garantir que boxes e fields estejam no objeto
        boxes: Array.isArray(data.boxes) ? data.boxes : [],
        fields: Array.isArray(data.fields) ? data.fields : []
      };
      
      // Collect section locks from boxes if available
      if (data.boxes && !data.section_locks) {
        docDataWithId.section_locks = data.boxes.map((box: any) => ({
          section_id: box.id,
          lock_when_signed: box.lockWhenSigned !== false,
          document_id: documentId
        }));
      }
      
      console.log("Dados a serem salvos:", docDataWithId);
      
      // Upsert na tabela document_templates - sempre salvar no banco de dados
      const { error, data: insertedData } = await supabase
        .from('document_templates')
        .upsert({
          id: documentId,
          type: docType,
          title: title,
          description: data.description || "",
          data: docDataWithId as any,
          is_template: isTemplate,
          export_format: exportFormat,  // Add export_format directly to the document_templates table
          created_by: userId,
          updated_at: new Date().toISOString()
        }, 
        { 
          onConflict: 'id'
        });
      
      if (error) {
        console.error("Erro ao salvar documento no Supabase:", error);
        
        // Tentar salvar localmente como fallback
        const localSave = saveFormData(docType, title, data);
        return { 
          success: localSave, 
          error: error 
        };
      }
      
      // Salvar bloqueios de seção
      if (docDataWithId.section_locks && docDataWithId.section_locks.length > 0) {
        try {
          // Remover bloqueios existentes
          await supabase
            .from('document_section_locks')
            .delete()
            .eq('document_id', documentId);
          
          // Inserir novos bloqueios
          const { error: lockError } = await supabase
            .from('document_section_locks')
            .insert(docDataWithId.section_locks.map((lock: any) => ({
              document_id: documentId,
              section_id: lock.section_id,
              lock_when_signed: lock.lock_when_signed !== false
            })));
          
          if (lockError) {
            console.error("Erro ao salvar bloqueios de seção:", lockError);
          }
        } catch (lockErr) {
          console.error("Erro ao processar bloqueios de seção:", lockErr);
        }
      }
      
      // Se salvou com sucesso, também atualizar no localStorage para compatibilidade
      saveFormData(docType, title, {
        ...docDataWithId,
        supabaseId: documentId
      });
      
      console.log("Documento salvo com sucesso no Supabase");
      return { 
        success: true, 
        id: documentId 
      };
    } catch (error: any) {
      console.error("Erro ao salvar documento:", error);
      return { 
        success: false, 
        error: error 
      };
    }
  },
  
  /**
   * Carrega documentos do Supabase
   */
  loadDocuments: async (docType: string, isTemplate?: boolean) => {
    try {
      console.log("Carregando documentos do Supabase:", { docType, isTemplate });
      
      let query = supabase
        .from('document_templates')
        .select('*, section_locks:document_section_locks(*)')
        .eq('is_deleted', false);
      
      // Se docType não for 'all', filtrar por tipo
      if (docType !== 'all') {
        query = query.eq('type', docType);
      }
      
      if (isTemplate !== undefined) {
        query = query.eq('is_template', isTemplate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao carregar documentos do Supabase:", error);
        // Fallback para documentos locais
        return getSavedForms(docType);
      }
      
      if (!data || data.length === 0) {
        console.log("Nenhum documento encontrado no Supabase, carregando do localStorage");
        // Fallback para documentos locais
        return getSavedForms(docType);
      }
      
      console.log(`${data.length} documentos carregados do Supabase`);
      
      // Processar documentos
      const processedDocs = data.map(doc => {
        // Garantir que doc.data seja um objeto
        const docData: DocumentData = (typeof doc.data === 'object' && doc.data !== null) 
          ? (doc.data as DocumentData) 
          : {};
        
        // Fix: Use the export_format property safely, checking both document and document.data
        // Use type assertion to access the property that TypeScript doesn't know exists
        const documentObj = doc as any; // Cast to any to bypass TypeScript checking
        
        // Determinar o valor correto para export_format
        const exportFormat = typeof documentObj.export_format === 'string' ? documentObj.export_format : 
                         (typeof docData.export_format === 'string' ? docData.export_format : 'PDF');
        
        // Acessar boxes e fields de forma segura
        const boxes = Array.isArray(docData.boxes) ? docData.boxes : [];
        const fields = Array.isArray(docData.fields) ? docData.fields : [];
        
        return {
          ...docData,
          id: doc.id,
          title: doc.title,
          name: doc.title,
          description: doc.description,
          date: doc.created_at,
          updated_at: doc.updated_at,
          formType: doc.type,
          isTemplate: doc.is_template,
          export_format: exportFormat,
          section_locks: doc.section_locks || [],
          supabaseId: doc.id,
          created_by: doc.created_by,
          boxes: boxes,
          fields: fields
        };
      });
      
      // Mesclar com documentos do localStorage
      const localDocs = getSavedForms(docType);
      const filteredLocalDocs = localDocs.filter(
        localDoc => !processedDocs.some(
          supaDoc => supaDoc.id === localDoc.id || supaDoc.id === localDoc.supabaseId
        )
      );
      
      return [...processedDocs, ...filteredLocalDocs];
    } catch (error: any) {
      console.error("Erro ao carregar documentos:", error);
      return getSavedForms(docType);
    }
  },
  
  /**
   * Salva documento como modelo
   */
  saveAsTemplate: async (
    docType: string,
    title: string,
    data: any,
    exportFormat: string = 'PDF'
  ) => {
    const templateData = {
      ...data,
      isTemplate: true,
      export_format: exportFormat,
      boxes: Array.isArray(data.boxes) ? data.boxes : [],
      fields: Array.isArray(data.fields) ? data.fields : []
    };
    
    return DocumentService.saveDocument(docType, title, templateData, true, exportFormat);
  },
  
  /**
   * Obtém um documento por ID
   */
  getDocumentById: async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*, section_locks:document_section_locks(*)')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      
      // Processar dados para garantir estrutura correta
      if (data && data.data) {
        // Garantir que data.data é um objeto
        const docData: DocumentData = (typeof data.data === 'object' && data.data !== null) 
          ? (data.data as DocumentData) 
          : {};
        
        // Fix: Use type assertion to access the property that TypeScript doesn't know exists
        const documentObj = data as any; // Cast to any to bypass TypeScript checking
        
        // Acessar export_format de forma segura
        const exportFormat = typeof documentObj.export_format === 'string' ? documentObj.export_format :
                         (typeof docData.export_format === 'string' ? docData.export_format : 'PDF');
                            
        // Acessar boxes e fields de forma segura
        const boxes = Array.isArray(docData.boxes) ? docData.boxes : [];
        const fields = Array.isArray(docData.fields) ? docData.fields : [];
        
        const processedData = {
          ...docData,
          id: data.id,
          title: data.title,
          name: data.title,
          description: data.description,
          date: data.created_at,
          updated_at: data.updated_at,
          formType: data.type,
          isTemplate: data.is_template,
          export_format: exportFormat,
          section_locks: data.section_locks || [],
          created_by: data.created_by,
          supabaseId: data.id,
          boxes: boxes,
          fields: fields
        };
        
        return { document: processedData, error: null };
      }
      
      return { document: data, error: null };
    } catch (error: any) {
      console.error("Erro ao obter documento por ID:", error);
      return { document: null, error: error.message };
    }
  },
  
  /**
   * Marca um documento como excluído
   */
  markDocumentAsDeleted: async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_deleted: true })
        .eq('id', documentId);
      
      return { success: !error, error };
    } catch (error: any) {
      console.error("Erro ao marcar documento como excluído:", error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Verifica se um documento está assinado
   */
  isDocumentSigned: (data: any) => {
    if (!data) return false;
    
    // Verificar se temos campos de assinatura com valor
    const hasSignature = Object.keys(data).some(key => {
      // Verificar se é um campo de assinatura preenchido
      return (
        (key.includes('signature') || key.includes('assinatura')) && 
        data[key] && 
        typeof data[key] === 'string' && 
        data[key].length > 10
      );
    });
    
    // Verificar nos valores do documento também
    const hasDocumentValueSignature = 
      data.document_values && 
      typeof data.document_values === 'object' && 
      Object.keys(data.document_values).some(key => {
        return (
          (key.includes('signature') || key.includes('assinatura')) && 
          data.document_values[key] && 
          typeof data.document_values[key] === 'string' && 
          data.document_values[key].length > 10
        );
      });
    
    return hasSignature || hasDocumentValueSignature;
  },
  
  /**
   * Check if a section is locked due to document being signed
   */
  isSectionLocked: (document: any, sectionId: string) => {
    if (!document) return false;
    
    // Check if document is signed
    const isDocumentSigned = DocumentService.isDocumentSigned(document);
    if (!isDocumentSigned) return false;
    
    // If document is signed, check section lock settings
    if (document.section_locks && document.section_locks.length > 0) {
      const sectionLock = document.section_locks.find((lock: any) => 
        lock.section_id === sectionId
      );
      
      if (sectionLock) {
        return sectionLock.lock_when_signed !== false;
      }
    }
    
    // If no specific section lock found but document is signed,
    // check the box settings in document data
    if (document.boxes) {
      const box = document.boxes.find((b: any) => b.id === sectionId);
      if (box) {
        // Default to locking if not explicitly set to false
        return box.lockWhenSigned !== false;
      }
    }
    
    // Default behavior: lock all sections when document is signed
    return true;
  }
};
