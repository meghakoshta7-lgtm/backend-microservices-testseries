import path from 'path';
import fs from 'fs';
import os from 'os';

export interface OCRExtractionResult {
  text: string;
  provider: 'scribe' | 'pdfjs';
  confidence: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

export class OCRService {
  private scribe: any = null;
  private initPromise: Promise<void> | null = null;

  private async getScribe(): Promise<any> {
    if (this.scribe) return this.scribe;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const mod = await import('scribe.js-ocr');
        this.scribe = mod.default || mod;
      })();
    }
    await this.initPromise;
    return this.scribe;
  }

  async extractWithScribe(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    try {
      const scribe = await this.getScribe();
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scribe-'));
      const tmpFile = path.join(tmpDir, 'document.pdf');
      fs.writeFileSync(tmpFile, pdfBuffer);

      const text = await scribe.extractText([tmpFile], ['eng'], 'txt', {
        skipRecPDFTextNative: false,
        skipRecPDFTextOCR: false,
      });

      fs.rmSync(tmpDir, { recursive: true, force: true });

      return {
        text: text || '',
        provider: 'scribe',
        confidence: 0.90,
        processingTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        text: '', provider: 'scribe', confidence: 0,
        processingTime: Date.now() - startTime, success: false,
        error: error instanceof Error ? error.message : 'Scribe extraction failed',
      };
    }
  }

  async extractSimple(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: pdfBuffer });
      const data = await parser.getText();
      return {
        text: data?.text || '',
        provider: 'pdfjs',
        confidence: 0.90,
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

  async extractWithFallback(pdfBuffer: Buffer, _isMathContent: boolean = false): Promise<OCRExtractionResult> {
    if (_isMathContent) {
      const result = await this.extractWithScribe(pdfBuffer);
      if (result.success && result.text.length > 50) return result;
    }
    return this.extractSimple(pdfBuffer);
  }

  isAvailable(): boolean { return true; }
  getAvailableProviders(): string[] { return ['scribe', 'pdfjs']; }
}

export const ocrService = new OCRService();
