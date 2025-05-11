
// Only fixing the specific issue with export_format property access
import { supabase } from "@/integrations/supabase/client";
import { saveFormData, getSavedForms } from "./formUtils";
import { v4 as uuidv4 } from 'uuid';

/**
 * Salva um modelo de documento no banco de dados Supabase
 * @param docType Tipo de documento
 * @param title Título/nome do documento
 * @param data Dados do documento
 * @param isTemplate Se é um modelo ou não
 * @param exportFormat Formato preferido para exportação (PDF, Word, Excel)
 * @returns Promise com resultado da operação
 */
export const saveDocumentToSupabase = async (
  docType: string,
  title: string,
  data: any,
  isTemplate: boolean = false,
  exportFormat: string = 'PDF'
): Promise<{success: boolean, id?: string, error?: any}> => {
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
    if (data.section_locks && data.section_locks.length > 0) {
      try {
        // Remover bloqueios existentes
        await supabase
          .from('document_section_locks')
          .delete()
          .eq('document_id', documentId);
        
        // Inserir novos bloqueios
        const { error: lockError } = await supabase
          .from('document_section_locks')
          .insert(data.section_locks.map((lock: any) => ({
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
  } catch (error) {
    console.error("Erro ao salvar documento:", error);
    return { 
      success: false, 
      error: error 
    };
  }
};

/**
 * Carrega modelos de documentos do banco de dados Supabase
 * @param docType Tipo de documento a carregar
 * @param isTemplate Filtrar apenas modelos ou não
 * @returns Documentos carregados
 */
export const loadDocumentsFromSupabase = async (
  docType: string,
  isTemplate?: boolean
) => {
  try {
    console.log("Carregando documentos do Supabase:", { docType, isTemplate });
    
    // Modifique a consulta para selecionar todos os campos, incluindo as colunas novas
    let query = supabase
      .from('document_templates')
      .select('*, section_locks:document_section_locks(*)')
      .eq('type', docType)
      .eq('is_deleted', false);
    
    // Se isTemplate foi especificado, adicionar filtro
    if (isTemplate !== undefined) {
      query = query.eq('is_template', isTemplate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao carregar documentos do Supabase:", error);
      // Carregando do localStorage como fallback
      return getSavedForms(docType);
    }
    
    if (!data || data.length === 0) {
      console.log("Nenhum documento encontrado no Supabase, carregando do localStorage");
      // Carregando do localStorage se não encontrou no Supabase
      return getSavedForms(docType);
    }
    
    console.log(`${data.length} documentos carregados do Supabase`);
    
    // Processar documentos do Supabase para o formato esperado
    const processedDocs = data.map(doc => {
      // Se doc.data existir e for um objeto, usamos ele, caso contrário usamos um objeto vazio
      const docData = doc.data && typeof doc.data === 'object' ? doc.data : {};
      
      // Determinar o valor correto para export_format, checando os tipos
      let exportFormat = 'PDF'; // valor padrão
      
      // Verificar se docData é um array ou um objeto
      if (Array.isArray(docData)) {
        // Se for um array, não tentamos acessar export_format
        console.log("doc.data é um array, usando valor padrão para export_format");
      } else {
        // Se for um objeto, tentamos acessar a propriedade
        exportFormat = (docData as any).export_format || doc.export_format || 'PDF';
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
        supabaseId: doc.id // Marcar que veio do Supabase
      };
    });
    
    // Mesclar com documentos do localStorage
    const localDocs = getSavedForms(docType);
    
    // Filtrar documentos locais que não tenham um correspondente no Supabase
    const filteredLocalDocs = localDocs.filter(
      localDoc => !processedDocs.some(
        supaDoc => supaDoc.id === localDoc.id || supaDoc.id === localDoc.supabaseId
      )
    );
    
    // Combinar os dois conjuntos
    return [...processedDocs, ...filteredLocalDocs];
  } catch (error) {
    console.error("Erro ao carregar documentos:", error);
    // Fallback para localStorage
    return getSavedForms(docType);
  }
};

/**
 * Salva um documento como modelo no Supabase
 * @param docType Tipo do documento
 * @param title Nome do modelo
 * @param data Dados do documento
 * @param exportFormat Formato preferido para exportação
 * @returns Resultado da operação
 */
export const saveAsTemplate = async (
  docType: string,
  title: string,
  data: any,
  exportFormat: string = 'PDF'
): Promise<{success: boolean, id?: string, error?: any}> => {
  // Adicionar propriedade isTemplate
  const templateData = {
    ...data,
    isTemplate: true,
    export_format: exportFormat
  };
  
  // Salvar como modelo
  return saveDocumentToSupabase(docType, title, templateData, true, exportFormat);
};
