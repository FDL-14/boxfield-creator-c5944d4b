
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
    const savedForms = JSON.parse(localStorage.getItem(savedFormsKey) || '[]');
    
    // Check if we're updating an existing form
    const existingIndex = savedForms.findIndex((form: any) => 
      form.id === data.id || (form.title === name && form.date === data.date)
    );
    
    if (existingIndex >= 0) {
      // Update existing form
      savedForms[existingIndex] = {
        ...savedForms[existingIndex],
        ...data,
        name,
        title: name,
        formType: formType,
        updated_at: new Date().toISOString()
      };
    } else {
      // Add new form
      const newForm = {
        id: data.id || Date.now(),
        name,
        title: name,
        data,
        date: new Date().toISOString(),
        formType: formType,
      };
      
      savedForms.push(newForm);
    }
    
    // Save back to localStorage
    localStorage.setItem(savedFormsKey, JSON.stringify(savedForms));
    
    return true;
  } catch (error) {
    console.error("Error saving form data:", error);
    return false;
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
