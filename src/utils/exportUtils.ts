
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Creates a formatted Excel cell value
 */
const createExcelCell = (value: any) => {
  if (typeof value === 'number') {
    return { v: value, t: 'n' };
  }
  if (typeof value === 'boolean') {
    return { v: value, t: 'b' };
  }
  if (value instanceof Date) {
    return { v: value, t: 'd' };
  }
  // Default to string
  return { v: String(value), t: 's' };
};

/**
 * Export form data to Excel
 * @param formData Object containing form field values
 * @param filename Filename for the downloaded file
 */
export const exportToExcel = (formData: any, filename: string = 'documento') => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert form data to array format for Excel
    const sheetData: any[][] = [];
    
    // Add headers row
    sheetData.push(['Campo', 'Valor']);
    
    // Add data rows
    Object.entries(formData).forEach(([key, value]) => {
      // Skip image and signature data (too large for Excel)
      if (typeof value === 'string' && (value.startsWith('data:image') || value.length > 1000)) {
        sheetData.push([key, '[Conteúdo não exportável para Excel]']);
      } else {
        sheetData.push([key, value]);
      }
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dados do Documento');
    
    // Auto-size columns
    const cols = [{ wch: 40 }, { wch: 60 }]; // Set column widths
    ws['!cols'] = cols;
    
    // Write to file and trigger download
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return false;
  }
};

/**
 * Export document to Word (DOCX)
 * This is a simple implementation that creates a Word-compatible HTML file
 * @param element DOM element to export
 * @param filename Filename for the downloaded file
 */
export const exportToWord = async (element: HTMLElement, filename: string = 'documento') => {
  try {
    // Convert the element to canvas first to capture styles
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });
    
    // Convert canvas to image
    const imageData = canvas.toDataURL('image/png');
    
    // Create Word-compatible HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        <h1>${filename}</h1>
        <div>
          <img src="${imageData}" alt="${filename}" />
        </div>
      </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.doc`;
    link.click();
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Word:', error);
    return false;
  }
};
