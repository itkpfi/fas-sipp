declare module "html2pdf.js" {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
    windowWidth?: number;
    windowHeight?: number;
  }

  interface JsPdfOptions {
    unit?: string;
    format?: string | [number, number];
    orientation?: "portrait" | "landscape" | string;
  }

  interface PagebreakOptions {
    mode?: string[];
    before?: string;
    after?: string;
    avoid?: string;
  }

  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: Html2CanvasOptions;
    jsPDF?: JsPdfOptions;
    pagebreak?: PagebreakOptions;
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(source: HTMLElement | string): Html2PdfWorker;
    save(filename?: string): Promise<void>;
  }

  interface Html2PdfFactory {
    (): Html2PdfWorker;
  }

  const html2pdf: Html2PdfFactory;
  export default html2pdf;
}
