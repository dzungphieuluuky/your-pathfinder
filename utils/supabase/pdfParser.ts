import * as pdfjsLib from 'pdfjs-dist';

// Use the correct worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Ensure worker is set before loading document
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += pageText + '\n\n';
        }
      } catch (pageError) {
        console.warn(`Failed to extract page ${i}:`, pageError);
        fullText += `[Page ${i} - extraction failed]\n\n`;
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('No text extracted from PDF - document may be image-based or corrupted');
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}