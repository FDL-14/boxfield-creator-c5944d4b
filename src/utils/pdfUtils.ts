
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a PDF from a DOM element
 * @param element The DOM element to convert to PDF
 * @param filename The name of the PDF file
 */
export const generatePDF = async (element: HTMLElement | null, filename: string = "documento") => {
  if (!element) return false;
  
  try {
    // Create a clone of the element to manipulate without affecting the UI
    const clone = element.cloneNode(true) as HTMLElement;
    const container = document.createElement('div');
    container.appendChild(clone);
    document.body.appendChild(container);
    
    // Style the clone for better PDF output
    clone.style.width = '210mm';
    clone.style.margin = '0';
    clone.style.padding = '10mm';
    clone.style.boxSizing = 'border-box';
    
    // Create canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      windowWidth: clone.offsetWidth,
      windowHeight: clone.offsetHeight
    });
    
    // Remove the clone from DOM after capturing
    document.body.removeChild(container);
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions (A4 format)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 287; // A4 height in mm (slightly less for margins)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Split into pages
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add subsequent pages if needed
    while (heightLeft > 0) {
      position = -pageHeight * (imgHeight - heightLeft) / imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

/**
 * Exports data to Excel format
 * @param data The data to export
 * @param filename The name of the Excel file
 */
export const exportToExcel = (data: any[], filename: string = "relatorio") => {
  if (!data || data.length === 0) return;
  
  try {
    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    });
    
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return false;
  }
};
