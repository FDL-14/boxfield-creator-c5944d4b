
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Exports data to Excel format
 * @param data The data to export
 * @param filename The name of the Excel file
 */
export const exportToExcel = (data: any, filename: string = "relatorio") => {
  try {
    // Convert object to array if it's not already
    const dataArray = Array.isArray(data) ? data : [data];
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    
    // Generate and save file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return false;
  }
};

/**
 * Exports DOM element to Word document
 * @param element The DOM element to export
 * @param filename The name of the Word document
 */
export const exportToWord = async (element: HTMLElement | null, filename: string = "documento") => {
  if (!element) return false;

  try {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply styles for Word document
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
        .header { background-color: #4472C4; color: white; padding: 10px; }
        .section-header { background-color: #5B9BD5; color: white; padding: 5px; margin-top: 10px; }
        .document-info { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        img { max-width: 100%; height: auto; }
      </style>
    `;
    
    // Prepare HTML content for Word
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${filename}</title>
          ${styles}
        </head>
        <body>
          ${clone.innerHTML}
        </body>
      </html>
    `;
    
    // Replace canvas elements with img (for signatures)
    html = html.replace(/<canvas(.*?)>(.*?)<\/canvas>/g, '<img$1 />');
    
    // Create blob for download
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    
    // Save file
    saveAs(blob, `${filename}.doc`);
    
    return true;
  } catch (error) {
    console.error("Error exporting to Word:", error);
    return false;
  }
};

/**
 * Reformats object data for export
 * @param data The original data object
 * @returns Formatted data for export
 */
export const formatExportData = (data: any) => {
  if (!data) return {};
  
  const formattedData = {};
  
  // Process form values
  if (data.values) {
    Object.entries(data.values).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('data:image')) {
        // Skip image data URLs
        formattedData[key] = '[Imagem]';
      } else {
        formattedData[key] = value;
      }
    });
  }
  
  // Add metadata
  if (data.title) formattedData['Título'] = data.title;
  if (data.createdAt) formattedData['Data de Criação'] = new Date(data.createdAt).toLocaleString();
  if (data.location?.formatted) formattedData['Localização'] = data.location.formatted;
  if (data.cancelled) formattedData['Status'] = 'CANCELADO';
  
  return formattedData;
};
