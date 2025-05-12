/**
 * Saves form data to localStorage
 * @param formType The type of form (e.g., 'analise-risco', 'permissao-trabalho')
 * @param name Name/identifier for the saved form
 * @param data The form data to save
 */
export const saveFormData = (formType: string, name: string, data: any) => {
  try {
    console.log("Salvando formulário:", { formType, name, data });
    
    // Garantir que temos dados válidos para salvar
    if (!formType || !name) {
      console.error("Tipo de formulário ou nome inválido");
      return false;
    }
    
    // Garantir que temos o ID do documento
    const formId = data.id || Date.now();
    
    // Get existing saved forms
    const savedFormsKey = `saved_forms_${formType}`;
    let savedForms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    // Check if we're updating an existing form
    const existingIndex = savedForms.findIndex((form: any) => 
      form.id === formId
    );
    
    // Create a deep copy of the data to prevent reference issues
    const dataCopy = JSON.parse(JSON.stringify(data));
    
    const newFormData = {
      ...(existingIndex >= 0 ? savedForms[existingIndex] : {}),
      id: formId,
      name,
      title: name,
      data: cleanDataForStorage({...dataCopy, id: formId}), // Clean the data to reduce storage size
      date: existingIndex >= 0 ? savedForms[existingIndex].date : new Date().toISOString(),
      formType: formType,
      updated_at: new Date().toISOString(),
      cancelled: dataCopy.cancelled || false,
      cancellationReason: dataCopy.cancellationReason || "",
      // Salvar os valores do documento - garantir que preservamos os valores
      document_values: dataCopy.document_values || {},
      // Salvar configurações de bloqueio de seções
      section_locks: dataCopy.section_locks || []
    };
    
    console.log("Dados do formulário a serem salvos:", newFormData);
    
    // Verificar se o formulário tem seções e campos (form builder)
    if (formType === 'form-builder' && dataCopy.boxes && dataCopy.fields) {
      newFormData.boxes = dataCopy.boxes;
      newFormData.fields = dataCopy.fields;
    }
    
    try {
      // Verificar disponibilidade de espaço
      const testStorage = () => {
        const testKey = `test_storage_${Date.now()}`;
        const testData = new Array(1024).fill('A').join(''); // 1KB de teste
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
      };
      
      testStorage(); // Testar se podemos escrever no localStorage
      
      // CORREÇÃO: Não deve substituir formulários existentes com o mesmo nome, mas criar novo
      if (existingIndex >= 0) {
        // Update existing form by ID only, not by name
        savedForms[existingIndex] = newFormData;
      } else {
        // Add as a new form - don't replace existing ones with same name
        // limit to 50 most recent documents if needed
        if (savedForms.length >= 50) {
          // Sort by date and keep only most recent ones
          savedForms.sort((a: any, b: any) => 
            new Date(b.updated_at || b.date).getTime() - new Date(a.updated_at || a.date).getTime()
          );
          savedForms = savedForms.slice(0, 49); // Keep 49 to make room for the new one
        }
        savedForms.push(newFormData);
      }
      
      // Antes de salvar no localStorage, verifique se não estamos excedendo o limite
      try {
        const dataToSave = JSON.stringify(savedForms);
        const estimatedSize = new Blob([dataToSave]).size;
        
        if (estimatedSize > 4.5 * 1024 * 1024) { // Se estiver perto do limite de 5MB
          console.warn("Dados muito grandes, reduzindo quantidade de formulários...");
          
          // Reduzir quantidade de formulários para 30
          savedForms.sort((a: any, b: any) => 
            new Date(b.updated_at || b.date).getTime() - new Date(a.updated_at || a.date).getTime()
          );
          
          // Garantir que o atual está incluído
          const currentForm = savedForms.find((form: any) => form.id === formId);
          const reducedForms = savedForms.slice(0, 30);
          
          if (currentForm && !reducedForms.some((form: any) => form.id === formId)) {
            reducedForms[reducedForms.length - 1] = currentForm;
          }
          
          savedForms = reducedForms;
        }
        
        localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
        console.log(`Formulário ${name} salvo com sucesso no tipo ${formType}. Total de formulários: ${savedForms.length}`);
        
        // Tentar salvar no Supabase se estiver conectado
        trySaveFormToSupabase(formType, newFormData);
        
        // Also save document types configuration if this is a form-builder type
        if (formType === 'form-builder') {
          const configSaved = saveDocumentTypeConfig(dataCopy);
          console.log("Configuração de tipo de documento salva:", configSaved);
        }
        
        return true;
      } catch (storageError: any) {
        // Se falhar no primeiro salvamento, tentar reduzir ainda mais
        console.error("Erro ao salvar no localStorage:", storageError);
        
        // Se o erro for de quota, tentar otimizar mais
        if (storageError.name === 'QuotaExceededError' || 
            storageError.code === 22 || 
            storageError.toString().includes('quota')) {
          console.warn("Quota excedida, limpando localStorage para espaço");
          
          // Tentar limpar outros dados desnecessários
          const keysToKeep = [savedFormsKey];
          Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                // Ignorar erros na limpeza
              }
            }
          });
          
          // Reduzir para apenas 15 documentos mais recentes
          savedForms.sort((a: any, b: any) => 
            new Date(b.updated_at || b.date).getTime() - new Date(a.updated_at || a.date).getTime()
          );
          
          // Garantir que o atual está incluído
          const currentForm = savedForms.find((form: any) => form.id === formId);
          const reducedForms = savedForms.slice(0, 15);
          
          if (currentForm && !reducedForms.some((form: any) => form.id === formId)) {
            reducedForms[reducedForms.length - 1] = currentForm;
          }
          
          // Limpar ainda mais os dados de cada formulário
          reducedForms.forEach((form: any) => {
            if (form.data) {
              // Remover dados grandes
              const minimalData: any = {
                id: form.data.id,
                title: form.data.title || form.title,
                formType: form.data.formType || form.formType,
                cancelled: form.data.cancelled || false,
                cancellationReason: form.data.cancellationReason || ""
              };
              
              form.data = minimalData;
            }
          });
          
          try {
            localStorage.setItem(savedFormsKey, JSON.stringify(reducedForms));
            console.log("Salvamento de emergência bem-sucedido com dados reduzidos");
            return true;
          } catch (finalError) {
            console.error("Falha final ao salvar:", finalError);
            
            // Última tentativa: Salvar apenas o documento atual com dados mínimos
            try {
              const minimalForm = {
                id: formId,
                name,
                title: name,
                date: new Date().toISOString(),
                formType,
                data: { 
                  id: formId, 
                  title: name,
                  cancelled: data.cancelled || false,
                  cancellationReason: data.cancellationReason || ""
                }
              };
              
              localStorage.setItem(savedFormsKey, JSON.stringify([minimalForm]));
              console.log("Salvamento mínimo de emergência realizado");
              return true;
            } catch (e) {
              console.error("Impossível salvar mesmo com dados mínimos:", e);
              return false;
            }
          }
        } else {
          throw storageError; // Rethrow if it's a different error
        }
      }
    } catch (error) {
      console.error("Erro crítico ao salvar dados do formulário:", error);
      return false;
    }
  } catch (error) {
    console.error("Erro crítico ao salvar dados do formulário:", error);
    return false;
  }
};

/**
 * Tenta salvar o formulário no Supabase se disponível
 */
const trySaveFormToSupabase = async (formType: string, formData: any) => {
  try {
    // Import supabase client
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Check if supabase is initialized and user is authenticated
    const session = await supabase.auth.getSession();
    if (session && session.data.session) {
      const { error } = await supabase
        .from('document_templates')
        .upsert({
          id: formData.id,
          type: formType,
          title: formData.title || formData.name,
          data: formData,
          is_template: false,
          updated_at: new Date().toISOString(),
          export_format: formData.export_format || 'PDF',
          description: formData.description || ""
        }, { onConflict: 'id' });
      
      if (error) {
        console.error("Erro ao salvar formulário no Supabase:", error);
      } else {
        console.log("Formulário salvo com sucesso no Supabase");
        
        // Se houver bloqueios de seção, salvar na tabela separada
        if (formData.section_locks && formData.section_locks.length > 0) {
          try {
            // Remover bloqueios existentes para este documento
            await supabase
              .from('document_section_locks')
              .delete()
              .eq('document_id', formData.id);
            
            // Inserir os novos bloqueios
            const { error: lockError } = await supabase
              .from('document_section_locks')
              .insert(formData.section_locks.map((lock: any) => ({
                document_id: formData.id,
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
      }
    }
  } catch (error) {
    console.error("Erro ao tentar salvar no Supabase:", error);
    // Continue anyway since we saved to localStorage
  }
};

/**
 * Clean data object to reduce storage size
 */
const cleanDataForStorage = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  
  // Create a deep copy to avoid modifying the original
  const cleanedData = JSON.parse(JSON.stringify(data));
  
  // Remove any base64 encoded image data which can be very large
  const processObject = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].length > 2000 && 
         (obj[key].startsWith('data:image') || key.includes('signature'))) {
        // Replace large data URLs with a placeholder to save space
        // For signature fields, keep them to preserve functionality
        if (!key.includes('signature')) {
          obj[key] = '[IMAGE DATA]';
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        processObject(obj[key]);
      }
    }
  };
  
  processObject(cleanedData);
  return cleanedData;
};

/**
 * Saves document type configuration
 * @param data The document type configuration data
 */
export const saveDocumentTypeConfig = (data: any) => {
  try {
    console.log("Salvando configuração de tipo de documento:", data);
    
    // Verificar se temos dados válidos
    if (!data) {
      console.error("Dados de configuração inválidos");
      return false;
    }
    
    // Store document type configuration
    const config = {
      boxes: data.boxes || [],
      fields: data.fields || [],
      updated_at: new Date().toISOString(),
      // Adicionar configurações de bloqueio de seção
      section_locks: data.section_locks || data.boxes?.map((box: any) => ({
        section_id: box.id,
        lock_when_signed: box.lockWhenSigned !== false
      })) || [],
      // Adicionar formato de exportação preferido
      export_format: data.export_format || 'PDF' // Default para PDF
    };
    
    console.log("Configuração a ser salva:", config);
    
    // Primeiro, salvar como configuração global
    try {
      // Adicionar em localStorage
      localStorage.setItem('document_type_config', JSON.stringify(config));
      console.log("Configuração de documento salva no localStorage");
      
      // Também salvar com nome específico se houver um nome no data
      if (data.title || data.name) {
        const configName = `document_type_config_${data.title || data.name}`;
        localStorage.setItem(configName, JSON.stringify(config));
        console.log(`Configuração específica '${data.title || data.name}' salva`);
      }
      
      // Criar um ID único baseado em timestamp se não existir
      const formId = data.id || Date.now();
      
      // Salvar também como um tipo de formulário para acesso posterior
      const formData = {
        id: formId,
        boxes: config.boxes,
        fields: config.fields,
        title: data.title || "Modelo de Formulário Personalizado",
        name: data.name || "Modelo de Formulário Personalizado",
        type: "form-builder",
        formType: "form-builder",
        date: new Date().toISOString(),
        section_locks: config.section_locks || [],
        export_format: config.export_format || 'PDF'
      };
      
      // Salvar como tipo de formulário
      const saved = saveFormData("form-builder", formData.title, formData);
      console.log("Configuração salva como formulário:", saved);
      
      // Tentar salvar no supabase
      trySaveTypeConfigToSupabase(formData);
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      
      // Tentar salvar versão reduzida em caso de erro
      try {
        const minConfig = {
          id: Date.now(),
          title: data.title || "Modelo de Formulário",
          date: new Date().toISOString()
        };
        localStorage.setItem('document_type_config_minimal', JSON.stringify(minConfig));
        return true;
      } catch (e) {
        console.error("Erro final ao salvar configuração mínima:", e);
        return false;
      }
    }
  } catch (error) {
    console.error("Erro ao salvar configuração de tipo de documento:", error);
    return false;
  }
};

/**
 * Tenta salvar a configuração de tipo de documento no Supabase
 */
const trySaveTypeConfigToSupabase = async (data: any) => {
  try {
    // Import supabase client
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Check if supabase is initialized and user is authenticated
    const session = await supabase.auth.getSession();
    if (session && session.data.session) {
      const { error } = await supabase
        .from('document_templates')
        .upsert({
          type: data.formType || 'form-builder',
          title: data.title || data.name,
          description: data.description || "",
          data: {
            ...data,
            export_format: data.export_format || 'PDF'
          },
          is_template: true,
          updated_at: new Date().toISOString(),
          export_format: data.export_format || 'PDF'
        }, { onConflict: 'id' });
      
      if (error) {
        console.error("Erro ao salvar configuração no Supabase:", error);
      } else {
        console.log("Configuração salva com sucesso no Supabase");
      }
    }
  } catch (error) {
    console.error("Erro ao tentar salvar no Supabase:", error);
    // Continue anyway since we saved to localStorage
  }
};

/**
 * Loads document type configuration
 */
export const loadDocumentTypeConfig = () => {
  try {
    const config = localStorage.getItem('document_type_config');
    console.log("Carregando configuração de tipo de documento:", config ? "Encontrado" : "Não encontrado");
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error("Erro ao carregar configuração de tipo de documento:", error);
    return null;
  }
};

/**
 * Gets all saved forms of a specific type
 * @param formType The type of form to get
 */
export const getSavedForms = (formType: string) => {
  try {
    const savedFormsKey = `saved_forms_${formType}`;
    const forms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    console.log(`Recuperados ${forms.length} formulários do tipo ${formType}`);
    return forms;
  } catch (error) {
    console.error("Erro ao obter formulários salvos:", error);
    return [];
  }
};

/**
 * Gets a specific saved form by ID
 * @param formType The type of form
 * @param id The ID of the form to get
 */
export const getSavedFormById = (formType: string, id: number) => {
  try {
    const savedForms = getSavedForms(formType);
    const form = savedForms.find((form: any) => form.id === id);
    console.log(`Recuperado formulário ID ${id} do tipo ${formType}:`, form ? "Encontrado" : "Não encontrado");
    return form || null;
  } catch (error) {
    console.error("Erro ao obter formulário por ID:", error);
    return null;
  }
};

/**
 * Deletes a saved form by ID
 * @param formType The type of form
 * @param id The ID of the form to delete
 */
export const deleteSavedForm = (formType: string, id: number | string) => {
  try {
    const savedFormsKey = `saved_forms_${formType}`;
    const savedForms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    const updatedForms = savedForms.filter((form: any) => form.id !== id);
    
    localStorage.setItem(savedFormsKey, JSON.stringify(updatedForms));
    console.log(`Formulário ID ${id} do tipo ${formType} excluído.`);
    
    return true;
  } catch (error) {
    console.error("Erro ao excluir formulário salvo:", error);
    return false;
  }
};

/**
 * Checks if a document section has a signed signature field
 * @param formValues The form values object
 * @param fieldsInSection Array of fields in a section
 * @returns Boolean indicating if the section has a signed field
 */
export const isSectionLocked = (formValues: any, fieldsInSection: any[]) => {
  // Check if any signature field in the section has a value (is signed)
  return fieldsInSection
    .filter(field => field.type === 'signature')
    .some(field => formValues[field.id]);
};

/**
 * Gets all sections that are locked due to signatures
 * @param formValues The form values object
 * @param boxes Array of all section boxes
 * @param fields Array of all fields
 * @returns Array of locked section IDs
 */
export const getLockedSections = (formValues: any, boxes: any[], fields: any[]) => {
  // First check if there's any signature in the document
  const signatureFields = fields.filter(field => field.type === 'signature');
  const hasAnySignature = signatureFields.some(field => formValues[field.id]);
  
  // If there's any signature in the document
  if (hasAnySignature) {
    // Get sections with signatures
    const sectionIdsWithSignatures = signatureFields
      .filter(field => formValues[field.id]) // Only signature fields that are signed
      .map(field => field.box_id); // IDs of sections containing signatures
    
    // Get section locks configuration
    const sectionLocks = formValues.section_locks || [];
    
    // Return IDs of sections that should be locked based on their lockWhenSigned setting
    return boxes
      .filter(box => {
        // If we have specific section lock configuration, use it
        const sectionLock = sectionLocks.find((lock: any) => lock.section_id === box.id);
        if (sectionLock) {
          return sectionLock.lock_when_signed !== false;
        }
        
        // If lockWhenSigned is explicitly false, don't lock
        if (box.lockWhenSigned === false) {
          return false;
        }
        
        return true; // Lock all other sections by default
      })
      .map(box => box.id);
  }
  
  // If there's no signature in the document, don't lock any section
  return [];
};

/**
 * Saves a document as cancelled
 * @param formType The type of form
 * @param id The ID of the form to mark as cancelled
 * @param reason Reason for cancellation
 * @param approvers Array of approvers who authorized the cancellation
 */
export const saveDocumentAsCancelled = (
  formType: string, 
  id: number, 
  reason: string = "", 
  approvers: any[] = []
) => {
  try {
    console.log(`Cancelando documento ID ${id} do tipo ${formType}`);
    
    const savedFormsKey = `saved_forms_${formType}`;
    const savedForms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    const formIndex = savedForms.findIndex((form: any) => form.id === id);
    
    if (formIndex >= 0) {
      console.log("Documento encontrado. Aplicando status de cancelado.");
      
      // Marcando como cancelado
      savedForms[formIndex] = {
        ...savedForms[formIndex],
        cancelled: true,
        cancellationReason: reason,
        cancellationDate: new Date().toISOString(),
        cancellationApprovers: approvers
      };
      
      // If there's data object, also mark it as cancelled
      if (savedForms[formIndex].data) {
        savedForms[formIndex].data.cancelled = true;
        savedForms[formIndex].data.cancellationReason = reason;
        savedForms[formIndex].data.cancellationApprovers = approvers;
      }
      
      localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
      console.log("Documento marcado como cancelado com sucesso.");
      return true;
    } else {
      console.error(`Documento ID ${id} não encontrado para cancelamento.`);
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao marcar documento como cancelado:", error);
    return false;
  }
};

/**
 * Verifica duplicações de campos em um formulário
 * @param fields Array de campos
 * @returns Array de IDs de campos duplicados
 */
export const findDuplicateFields = (fields: any[]) => {
  const fieldIds = new Set();
  const duplicates = new Set();
  
  fields.forEach(field => {
    if (fieldIds.has(field.id)) {
      duplicates.add(field.id);
    } else {
      fieldIds.add(field.id);
    }
  });
  
  return Array.from(duplicates);
};

/**
 * Verifica duplicações de seções em um formulário
 * @param boxes Array de seções
 * @returns Array de IDs de seções duplicadas
 */
export const findDuplicateBoxes = (boxes: any[]) => {
  const boxIds = new Set();
  const duplicates = new Set();
  
  boxes.forEach(box => {
    if (boxIds.has(box.id)) {
      duplicates.add(box.id);
    } else {
      boxIds.add(box.id);
    }
  });
  
  return Array.from(duplicates);
};

/**
 * Corrige IDs duplicados em campos e seções
 * @param boxes Array de seções
 * @param fields Array de campos
 * @returns Objeto com arrays corrigidos
 */
export const fixDuplicateIds = (boxes: any[], fields: any[]) => {
  const boxIdMap = new Map();
  const fieldIdMap = new Map();
  
  // Criar novos arrays para evitar mutar os originais
  const fixedBoxes = boxes.map(box => {
    const newBox = { ...box };
    if (boxIdMap.has(box.id)) {
      // Se já existe este ID, criar um novo
      newBox.id = Date.now() + Math.floor(Math.random() * 10000);
      boxIdMap.set(box.id, newBox.id);
    } else {
      boxIdMap.set(box.id, box.id);
    }
    return newBox;
  });
  
  const fixedFields = fields.map(field => {
    const newField = { ...field };
    if (fieldIdMap.has(field.id)) {
      // Se já existe este ID, criar um novo
      newField.id = Date.now() + Math.floor(Math.random() * 10000);
      fieldIdMap.set(field.id, newField.id);
    } else {
      fieldIdMap.set(field.id, field.id);
    }
    
    // Atualizar box_id se a seção foi alterada
    if (boxIdMap.has(field.box_id) && boxIdMap.get(field.box_id) !== field.box_id) {
      newField.box_id = boxIdMap.get(field.box_id);
    }
    
    return newField;
  });
  
  return { boxes: fixedBoxes, fields: fixedFields };
};

/**
 * Prepara um modelo de formulário para uso, garantindo IDs únicos
 * @param template O modelo de formulário
 * @returns Modelo com IDs únicos
 */
export const prepareFormTemplate = (template: any) => {
  if (!template) return null;
  
  let boxes = template.boxes || [];
  let fields = template.fields || [];
  
  // Verificar se há duplicações
  const duplicateBoxes = findDuplicateBoxes(boxes);
  const duplicateFields = findDuplicateFields(fields);
  
  // Corrigir se necessário
  if (duplicateBoxes.length > 0 || duplicateFields.length > 0) {
    console.log("Corrigindo IDs duplicados no modelo");
    const fixed = fixDuplicateIds(boxes, fields);
    boxes = fixed.boxes;
    fields = fixed.fields;
  }
  
  return { ...template, boxes, fields };
};

/**
 * Verifica se o formulário salvo contém todos os dados necessários
 * @param form O formulário salvo
 * @returns Booleano indicando se o formulário está completo
 */
export const isFormComplete = (form: any) => {
  if (!form) return false;
  
  // Verificar se o formulário tem os campos essenciais
  if (!form.id || !form.name || !form.title || !form.formType) {
    return false;
  }
  
  // Verificar se o formulário tem dados completos
  if (!form.data || typeof form.data !== 'object') {
    return false;
  }
  
  // Para form-builder, verificar se tem boxes e fields
  if (form.formType === 'form-builder') {
    if (!form.boxes || !form.fields || !Array.isArray(form.boxes) || !Array.isArray(form.fields)) {
      return false;
    }
  }
  
  // Verificar valores do documento
  if (!form.document_values || typeof form.document_values !== 'object') {
    return false;
  }
  
  return true;
};

/**
 * Verifica e repara formulários salvos com problemas
 * @param formType O tipo de formulário
 */
export const checkAndRepairSavedForms = async (formType: string) => {
  try {
    const savedFormsKey = `saved_forms_${formType}`;
    const forms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    let hasChanges = false;
    const repairedForms = forms.filter((form: any) => {
      const isComplete = isFormComplete(form);
      if (!isComplete) {
        console.warn(`Formulário ID ${form.id} incompleto, removendo...`);
        hasChanges = true;
        return false;
      }
      return true;
    });
    
    if (hasChanges) {
      localStorage.setItem(savedFormsKey, JSON.stringify(repairedForms));
      console.log(`Reparados ${forms.length - repairedForms.length} formulários no tipo ${formType}`);
    }
    
    return repairedForms;
  } catch (error) {
    console.error("Erro ao verificar e reparar formulários salvos:", error);
    return [];
  }
};
