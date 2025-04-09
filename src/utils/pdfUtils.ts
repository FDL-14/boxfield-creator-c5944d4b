
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a PDF from a DOM element
 * @param element The DOM element to convert to PDF
 * @param filename The name of the PDF file
 * @param options Additional options like cancelled status
 */
export const generatePDF = async (
  element: HTMLElement | null, 
  filename: string = "documento", 
  options: { cancelled?: boolean; cancellationReason?: string } = {}
) => {
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
    clone.style.position = 'relative';
    
    // Apply styling optimizations for PDF layout
    const sections = clone.querySelectorAll('.section-container');
    sections.forEach((section: Element) => {
      const sectionEl = section as HTMLElement;
      
      // Apply section-specific layout if available
      if (sectionEl.dataset.alignment) {
        sectionEl.style.textAlign = sectionEl.dataset.alignment;
      }
      
      if (sectionEl.dataset.width) {
        const width = sectionEl.dataset.width;
        sectionEl.style.width = `${width}%`;
        sectionEl.style.marginLeft = 'auto';
        sectionEl.style.marginRight = 'auto';
      }
      
      if (sectionEl.dataset.padding) {
        // Convert string to number before multiplication
        const paddingValue = parseInt(sectionEl.dataset.padding, 10);
        sectionEl.style.padding = `${paddingValue * 4}px`;
      }
      
      if (sectionEl.dataset.margin) {
        // Convert string to number before multiplication
        const marginValue = parseInt(sectionEl.dataset.margin, 10);
        sectionEl.style.margin = `${marginValue * 4}px auto`;
      }
      
      // Ensure proper spacing
      sectionEl.style.pageBreakInside = 'avoid';
      sectionEl.style.marginBottom = '15px';
    });
    
    // Apply column layouts to the field containers
    const fieldContainers = clone.querySelectorAll('.field-container');
    fieldContainers.forEach((container: Element) => {
      const containerEl = container as HTMLElement;
      
      if (containerEl.dataset.columns) {
        const columns = parseInt(containerEl.dataset.columns, 10);
        if (columns === 1) {
          containerEl.style.display = 'block';
        } else if (columns === 2 || columns === 3) {
          containerEl.style.display = 'grid';
          containerEl.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
          containerEl.style.gap = '10px';
        }
      }
    });
    
    // Improve rendering of form fields
    const formFields = clone.querySelectorAll('input, textarea, select');
    formFields.forEach((field: Element) => {
      const fieldEl = field as HTMLElement;
      fieldEl.style.border = '1px solid #ddd';
      fieldEl.style.padding = '4px';
      fieldEl.style.minHeight = '24px';
    });
    
    // Add watermark for cancelled documents
    if (options.cancelled) {
      // Add a large watermark that spans the entire document
      const watermarkContainer = document.createElement('div');
      watermarkContainer.style.position = 'absolute';
      watermarkContainer.style.top = '0';
      watermarkContainer.style.left = '0';
      watermarkContainer.style.width = '100%';
      watermarkContainer.style.height = '100%';
      watermarkContainer.style.pointerEvents = 'none';
      watermarkContainer.style.zIndex = '1000';
      
      // Add document title with cancelled status
      const cancelledTitle = document.createElement('div');
      cancelledTitle.textContent = 'DOCUMENTO CANCELADO';
      cancelledTitle.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      cancelledTitle.style.color = 'rgba(255, 0, 0, 0.8)';
      cancelledTitle.style.padding = '10px';
      cancelledTitle.style.textAlign = 'center';
      cancelledTitle.style.fontSize = '16px';
      cancelledTitle.style.fontWeight = 'bold';
      cancelledTitle.style.marginBottom = '15px';
      clone.insertBefore(cancelledTitle, clone.firstChild);
      
      // Create diagonal watermark overlay
      const watermark = document.createElement('div');
      watermark.textContent = 'CANCELADO';
      watermark.style.position = 'fixed';
      watermark.style.top = '50%';
      watermark.style.left = '50%';
      watermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
      watermark.style.fontSize = '120px';
      watermark.style.fontWeight = 'bold';
      watermark.style.color = 'rgba(255, 0, 0, 0.4)';
      watermark.style.textAlign = 'center';
      watermark.style.whiteSpace = 'nowrap';
      watermark.style.width = '100%';
      watermark.style.pointerEvents = 'none';
      
      // If there's a cancellation reason, add it to the watermark
      if (options.cancellationReason) {
        const reasonElement = document.createElement('div');
        reasonElement.textContent = `Motivo: ${options.cancellationReason}`;
        reasonElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        reasonElement.style.color = 'rgba(255, 0, 0, 0.8)';
        reasonElement.style.padding = '10px';
        reasonElement.style.marginTop = '10px';
        reasonElement.style.marginBottom = '15px';
        reasonElement.style.fontSize = '14px';
        clone.insertBefore(reasonElement, clone.firstChild.nextSibling);
      }
      
      watermarkContainer.appendChild(watermark);
      clone.appendChild(watermarkContainer);
    }
    
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
    pdf.save(`${filename}${options.cancelled ? '-CANCELADO' : ''}.pdf`);
    
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
