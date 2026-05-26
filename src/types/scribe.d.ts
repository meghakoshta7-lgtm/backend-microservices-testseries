declare module 'scribe.js-ocr' {
  const scribe: {
    extractText: (
      files: string[],
      langs?: string[],
      outputFormat?: string,
      options?: Record<string, any>
    ) => Promise<string>;
    init: (params?: Record<string, any>) => Promise<void>;
    importFiles: (files: string[]) => Promise<void>;
    recognize: (options?: Record<string, any>) => Promise<any>;
    terminate: () => Promise<void>;
    utils: Record<string, any>;
  };
  export default scribe;
}
