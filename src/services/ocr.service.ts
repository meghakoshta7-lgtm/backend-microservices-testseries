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
  async extractSimple(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    const startTime = Date.now();

    try {
      const parser = new PDFParse({ data: pdfBuffer });
      const data = await parser.getText();
      const processingTime = Date.now() - startTime;

      return {
        text: data.text || '',
        provider: 'pdfjs',
        confidence: 0.95,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        text: '',
        provider: 'pdfjs',
        confidence: 0,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'PDF extraction failed',
      };
    }
  }

  async extractWithFallback(
    pdfBuffer: Buffer,
    _isMathContent: boolean = false,
  ): Promise<OCRExtractionResult> {
    return this.extractSimple(pdfBuffer);
  }

  isAvailable(): boolean {
    return true;
  }

  getAvailableProviders(): string[] {
    return ['pdfjs'];
  }
}

export const ocrService = new OCRService();
