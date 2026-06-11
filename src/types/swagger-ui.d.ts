declare global {
  interface Window {
    SwaggerUIBundle: {
      (options: {
        spec?: any;
        url?: string;
        dom_id?: string;
        deepLinking?: boolean;
        presets?: any[];
        plugins?: any[];
        layout?: string;
      }): any;
      presets: {
        apis: any;
        standalone: any;
      };
      plugins: {
        DownloadUrl: any;
      };
    };
  }
}

export {};

