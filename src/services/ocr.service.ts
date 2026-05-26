import axios, { AxiosError } from 'axios';
import FormData from 'form-data';

export interface OCRExtractionResult {
  text: string;
  provider: 'pdfjs' | 'nougat' | 'pix2text';
  confidence: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

interface NougatServiceResponse {
  text: string;
  confidence?: number;
  processing_time?: number;
}

interface Pix2TextResponse {
  data: {
    text: string;
    confidence?: number;
  }[];
}

export class OCRService {
  private nougatApiUrl = process.env.NOUGAT_API_URL || '';
  private pix2TextApiKey = process.env.PIX2TEXT_API_KEY || '';
  private pix2TextEndpoint = 'https://api.pix2text.com/v1/extract';

  async extractWithNougat(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    const startTime = Date.now();

    if (!this.nougatApiUrl) {
      return {
        text: '',
        provider: 'nougat',
        confidence: 0,
        processingTime: 0,
        success: false,
        error: 'NOUGAT_API_URL not configured',
      };
    }

    try {
      const formData = new FormData();
      formData.append('pdf', pdfBuffer, {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      });

      const response = await axios.post<NougatServiceResponse>(
        `${this.nougatApiUrl}/predict`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        text: response.data.text || '',
        provider: 'nougat',
        confidence: response.data.confidence ?? 0.85,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg = error instanceof AxiosError
        ? `Nougat API Error: ${error.response?.status || error.code} - ${error.message}`
        : 'Nougat extraction failed';

      return {
        text: '',
        provider: 'nougat',
        confidence: 0,
        processingTime,
        success: false,
        error: errorMsg,
      };
    }
  }

  async extractWithPix2Text(pdfBuffer: Buffer): Promise<OCRExtractionResult> {
    const startTime = Date.now();

    if (!this.pix2TextApiKey) {
      return {
        text: '',
        provider: 'pix2text',
        confidence: 0,
        processingTime: 0,
        success: false,
        error: 'Pix2Text API key not configured',
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', pdfBuffer, {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      });

      const response = await axios.post<Pix2TextResponse>(
        this.pix2TextEndpoint,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.pix2TextApiKey}`,
          },
          timeout: 60000,
        }
      );

      const processingTime = Date.now() - startTime;
      const extractedText = response.data.data?.map(item => item.text).join('\n') || '';

      return {
        text: extractedText,
        provider: 'pix2text',
        confidence: 0.80,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg = error instanceof AxiosError
        ? `Pix2Text API Error: ${error.response?.status || error.code} - ${error.message}`
        : 'Pix2Text extraction failed';

      return {
        text: '',
        provider: 'pix2text',
        confidence: 0,
        processingTime,
        success: false,
        error: errorMsg,
      };
    }
  }

  async extractWithFallback(
    pdfBuffer: Buffer,
    isMathContent: boolean = false,
  ): Promise<OCRExtractionResult> {
    if (isMathContent || this.nougatApiUrl) {
      const nougatResult = await this.extractWithNougat(pdfBuffer);
      if (nougatResult.success && nougatResult.text.length > 100) {
        return nougatResult;
      }
    }

    if (this.pix2TextApiKey) {
      const pix2TextResult = await this.extractWithPix2Text(pdfBuffer);
      if (pix2TextResult.success && pix2TextResult.text.length > 100) {
        return pix2TextResult;
      }
    }

    return {
      text: '',
      provider: 'nougat',
      confidence: 0,
      processingTime: 0,
      success: false,
      error: 'All OCR providers failed. Check Nougat service URL and PDF format.',
    };
  }

  isAvailable(): boolean {
    return !!(this.nougatApiUrl || this.pix2TextApiKey);
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.nougatApiUrl) providers.push('nougat');
    if (this.pix2TextApiKey) providers.push('pix2text');
    return providers;
  }
}

export const ocrService = new OCRService();
