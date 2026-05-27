import { PDFParse } from 'pdf-parse';

export interface OCRExtractionResult {
  text: string;
  provider: 'pdfjs';
  confidence: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

export class OCRService {
  async extractText(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    try {
      const parser = new PDFParse({ data: pdfBuffer });
      const data = await parser.getText();
      const text = data?.text || '';
      return {
        text,
        provider: 'pdfjs',
        confidence: text.length > 100 ? 0.9 : 0.5,
        processingTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        text: '', provider: 'pdfjs', confidence: 0,
        processingTime: Date.now() - startTime, success: false,
        error: error instanceof Error ? error.message : 'PDF extraction failed',
      };
    }
  }

  async extractWithFallback(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    return this.extractText(pdfBuffer);
  }

  isAvailable(): boolean { return true; }
  getAvailableProviders(): string[] { return ['pdfjs']; }
}

export const ocrService = new OCRService();
