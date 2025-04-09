
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
      form.id === formId || (form.title === name && form.date === data.date)
    );
    
    const newFormData = {
      ...(existingIndex >= 0 ? savedForms[existingIndex] : {}),
      id: formId,
      name,
      title: name,
      data: cleanDataForStorage({...data, id: formId}), // Clean the data to reduce storage size
      date: existingIndex >= 0 ? savedForms[existingIndex].date : new Date().toISOString(),
      formType: formType,
      updated_at: new Date().toISOString(),
      cancelled: data.cancelled || false,
      cancellationReason: data.cancellationReason || ""
    };
    
    console.log("Dados do formulário a serem salvos:", newFormData);
    
    // Verificar se o formulário tem seções e campos (form builder)
    if (formType === 'form-builder' && data.boxes && data.fields) {
      newFormData.boxes = data.boxes;
      newFormData.fields = data.fields;
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
      
      if (existingIndex >= 0) {
        // Update existing form
        savedForms[existingIndex] = newFormData;
      } else {
        // Add new form - limit to 20 most recent documents if needed
        if (savedForms.length >= 20) {
          // Sort by date and keep only most recent ones
          savedForms.sort((a: any, b: any) => 
            new Date(b.updated_at || b.date).getTime() - new Date(a.updated_at || a.date).getTime()
          );
          savedForms = savedForms.slice(0, 19); // Keep 19 to make room for the new one
        }
        savedForms.push(newFormData);
      }
      
      // Try to save to localStorage
      const dataToSave = JSON.stringify(savedForms);
      localStorage.setItem(savedFormsKey, dataToSave);
      
      console.log(`Formulário ${name} salvo com sucesso no tipo ${formType}.`);
      
      // Also save document types configuration if this is a form-builder type
      if (formType === 'form-builder') {
        const configSaved = saveDocumentTypeConfig(data);
        console.log("Configuração de tipo de documento salva:", configSaved);
      }
      
      return true;
    } catch (storageError: any) {
      console.error("Erro ao salvar no localStorage:", storageError);
      
      if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
        console.warn("Storage quota exceeded, pruning older documents");
        
        // If we hit quota, prune data further and try again
        if (savedForms.length > 5) {
          savedForms = savedForms.slice(-5); // Just keep 5 most recent
          try {
            localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
            return true;
          } catch (e) {
            // Falha mesmo após reduzir para 5 documentos
            console.error("Falha ao salvar mesmo após reduzir quantidade:", e);
          }
        } 
        
        // If still not enough, try to reduce data size for all items
        try {
          savedForms.forEach((form: any) => {
            if (form.data && typeof form.data === 'object') {
              // Remove any large data that's not essential
              delete form.data.signatures;
              delete form.data.images;
              delete form.data.attachments;
              
              // Limitar tamanho de valores de string
              Object.keys(form.data).forEach(key => {
                if (typeof form.data[key] === 'string' && form.data[key].length > 1000) {
                  form.data[key] = form.data[key].substring(0, 1000) + '...';
                }
              });
            }
          });
          
          // Adicionar o novo formulário otimizado
          if (existingIndex >= 0) {
            savedForms[existingIndex] = {
              ...newFormData,
              data: { id: formId, name, title: name } // Dados mínimos
            };
          } else {
            savedForms.push({
              ...newFormData,
              data: { id: formId, name, title: name } // Dados mínimos
            });
          }
          
          localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
          return true;
        } catch (finalError) {
          console.error("Falha final ao tentar salvar o formulário:", finalError);
          return false;
        }
      } else {
        throw storageError; // Rethrow if it's a different error
      }
    }
  } catch (error) {
    console.error("Erro crítico ao salvar dados do formulário:", error);
    return false;
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
        obj[key] = '[IMAGE DATA]';
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
      updated_at: new Date().toISOString()
    };
    
    // Adicionar em localStorage
    localStorage.setItem('document_type_config', JSON.stringify(config));
    console.log("Configuração de documento salva no localStorage");
    
    // Salvar também como um tipo de formulário para acesso posterior
    const formData = {
      id: Date.now(),
      boxes: config.boxes,
      fields: config.fields,
      title: "Modelo de Formulário Personalizado",
      name: "Modelo de Formulário Personalizado",
      type: "form-builder",
      date: new Date().toISOString()
    };
    
    // Salvar como tipo de formulário
    const saved = saveFormData("form-builder", "Modelo de Formulário Personalizado", formData);
    console.log("Configuração salva como formulário:", saved);
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar configuração de tipo de documento:", error);
    return false;
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
export const deleteSavedForm = (formType: string, id: number) => {
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
  return boxes
    .filter(box => {
      const fieldsInSection = fields.filter(field => field.box_id === box.id);
      return isSectionLocked(formValues, fieldsInSection);
    })
    .map(box => box.id);
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
