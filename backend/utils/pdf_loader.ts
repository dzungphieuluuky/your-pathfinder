import pdfParse from 'pdf-parse'
import fs from 'fs'

export class PDFLoader {
  async loadPDF(filePath: string): Promise<{ text: string; numPages: number }> {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const data = await pdfParse(dataBuffer)

      return {
        text: data.text,
        numPages: data.numpages
      }
    } catch (error) {
      console.error('Error loading PDF:', error)
      throw error
    }
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.slice(start, end))
      start = end - overlap
    }

    return chunks
  }
}