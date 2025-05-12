
import { supabase } from "@/integrations/supabase/client";
import { saveFormData, getSavedForms } from "@/utils/formUtils";
import { v4 as uuidv4 } from 'uuid';

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
      
      if (!sessionData.session) {
        console.log("Usuário não autenticado, salvando localmente");
        // Se não estiver autenticado, salvar localmente
        saveFormData(docType, title, {...data, export_format: exportFormat});
        return { success: true };
      }
      
      // Preparar dados para salvar
      const userId = sessionData.session.user.id;
      const documentId = data.id || uuidv4();
      
      // Adicionar ID à cópia dos dados
      const docDataWithId = {
        ...data,
        id: documentId,
        export_format: exportFormat
      };
      
      // Collect section locks from boxes if available
      if (data.boxes && !data.section_locks) {
        docDataWithId.section_locks = data.boxes.map((box: any) => ({
          section_id: box.id,
          lock_when_signed: box.lockWhenSigned !== false,
          document_id: documentId
        }));
      }
      
      // Upsert na tabela document_templates
      const { error, data: insertedData } = await supabase
        .from('document_templates')
        .upsert({
          id: documentId,
          type: docType,
          title: title,
          description: data.description || "",
          data: docDataWithId,
          is_template: isTemplate,
          export_format: exportFormat,
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
      
      // Se salvou com sucesso, também atualizar no localStorage
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
        .eq('type', docType)
        .eq('is_deleted', false);
      
      if (isTemplate !== undefined) {
        query = query.eq('is_template', isTemplate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao carregar documentos do Supabase:", error);
        return getSavedForms(docType);
      }
      
      if (!data || data.length === 0) {
        console.log("Nenhum documento encontrado no Supabase, carregando do localStorage");
        return getSavedForms(docType);
      }
      
      console.log(`${data.length} documentos carregados do Supabase`);
      
      // Processar documentos
      const processedDocs = data.map(doc => {
        const docData = doc.data && typeof doc.data === 'object' ? doc.data : {};
        
        // Determinar o valor correto para export_format
        let exportFormat = 'PDF'; // valor padrão
        
        if (Array.isArray(docData)) {
          console.log("doc.data é um array, usando valor padrão para export_format");
        } else {
          exportFormat = (docData as any).export_format || 'PDF';
        }
        
        // Verificar se o próprio documento tem a propriedade export_format
        if ((doc as any).export_format) {
          exportFormat = (doc as any).export_format;
        }
        
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
          supabaseId: doc.id
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
      export_format: exportFormat
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
