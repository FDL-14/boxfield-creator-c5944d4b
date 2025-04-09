/**
 * Saves form data to localStorage
 * @param formType The type of form (e.g., 'analise-risco', 'permissao-trabalho')
 * @param name Name/identifier for the saved form
 * @param data The form data to save
 */
export const saveFormData = (formType: string, name: string, data: any) => {
  try {
    // Get existing saved forms
    const savedFormsKey = `saved_forms_${formType}`;
    let savedForms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    // Check if we're updating an existing form
    const existingIndex = savedForms.findIndex((form: any) => 
      form.id === data.id || (form.title === name && form.date === data.date)
    );
    
    const newFormData = {
      ...(existingIndex >= 0 ? savedForms[existingIndex] : {}),
      id: data.id || Date.now(),
      name,
      title: name,
      data: cleanDataForStorage(data), // Clean the data to reduce storage size
      date: existingIndex >= 0 ? savedForms[existingIndex].date : new Date().toISOString(),
      formType: formType,
      updated_at: new Date().toISOString(),
      cancelled: data.cancelled || false,
      cancellationReason: data.cancellationReason || ""
    };
    
    if (existingIndex >= 0) {
      // Update existing form
      savedForms[existingIndex] = newFormData;
    } else {
      // Add new form - limit to 20 most recent documents if storage is becoming an issue
      if (savedForms.length > 20) {
        // Sort by date and keep only most recent 20
        savedForms.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        savedForms = savedForms.slice(0, 19); // Keep 19 to make room for the new one
      }
      savedForms.push(newFormData);
    }
    
    try {
      // Try to save to localStorage
      localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
    } catch (storageError) {
      if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
        console.warn("Storage quota exceeded, pruning older documents");
        
        // If we hit quota, prune data further and try again
        if (savedForms.length > 5) {
          savedForms = savedForms.slice(-5); // Just keep 5 most recent
          localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
        } else {
          // If still not enough, try to reduce data size for current items
          savedForms.forEach((form: any) => {
            if (form.data && typeof form.data === 'object') {
              // Remove any large data that's not essential
              if (form.data.signatures) delete form.data.signatures;
              if (form.data.images) delete form.data.images;
              if (form.data.attachments) delete form.data.attachments;
            }
          });
          localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
        }
      } else {
        throw storageError; // Rethrow if it's a different error
      }
    }
    
    // Also save document types configuration if this is a form-builder type
    if (formType === 'form-builder') {
      saveDocumentTypeConfig(data);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving form data:", error);
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
    // Store document type configuration
    const config = {
      boxes: data.boxes || [],
      fields: data.fields || [],
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('document_type_config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error("Error saving document type config:", error);
    return false;
  }
};

/**
 * Loads document type configuration
 */
export const loadDocumentTypeConfig = () => {
  try {
    const config = localStorage.getItem('document_type_config');
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error("Error loading document type config:", error);
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
    return JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
  } catch (error) {
    console.error("Error getting saved forms:", error);
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
    return savedForms.find((form: any) => form.id === id) || null;
  } catch (error) {
    console.error("Error getting saved form by ID:", error);
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
    
    return true;
  } catch (error) {
    console.error("Error deleting saved form:", error);
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
    const savedFormsKey = `saved_forms_${formType}`;
    const savedForms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    const formIndex = savedForms.findIndex((form: any) => form.id === id);
    
    if (formIndex >= 0) {
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
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error marking document as cancelled:", error);
    return false;
  }
};
