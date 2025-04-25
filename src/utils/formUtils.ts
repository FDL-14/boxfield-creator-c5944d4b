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
      
      // Antes de salvar no localStorage, verifique se não estamos excedendo o limite
      try {
        const dataToSave = JSON.stringify(savedForms);
        const estimatedSize = new Blob([dataToSave]).size;
        
        if (estimatedSize > 4.5 * 1024 * 1024) { // Se estiver perto do limite de 5MB
          console.warn("Dados muito grandes, reduzindo quantidade de formulários...");
          
          // Reduzir quantidade de formulários para 10
          savedForms.sort((a: any, b: any) => 
            new Date(b.updated_at || b.date).getTime() - new Date(a.updated_at || a.date).getTime()
          );
          
          // Garantir que o atual está incluído
          const currentForm = savedForms.find((form: any) => form.id === formId);
          const reducedForms = savedForms.slice(0, 10);
          
          if (currentForm && !reducedForms.some((form: any) => form.id === formId)) {
            reducedForms[reducedForms.length - 1] = currentForm;
          }
          
          savedForms = reducedForms;
        }
        
        localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
        console.log(`Formulário ${name} salvo com sucesso no tipo ${formType}.`);
        
        // Also save document types configuration if this is a form-builder type
        if (formType === 'form-builder') {
          const configSaved = saveDocumentTypeConfig(data);
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
          
          // Reduzir para apenas 5 documentos mais recentes
          savedForms.sort((a: any, b: any) => 
            new Date(b.updated_at || b.date).getTime() - new Date(a.updated_at || a.date).getTime()
          );
          
          // Garantir que o atual está incluído
          const currentForm = savedForms.find((form: any) => form.id === formId);
          const reducedForms = savedForms.slice(0, 5);
          
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
        date: new Date().toISOString()
      };
      
      // Salvar como tipo de formulário
      const saved = saveFormData("form-builder", formData.title, formData);
      console.log("Configuração salva como formulário:", saved);
      
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
