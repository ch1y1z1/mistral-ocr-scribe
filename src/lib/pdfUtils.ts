import { createPdfFromImages } from './lazyImports';

export const convertImagesToPdf = async (imageFiles: File[]): Promise<Uint8Array> => {
  const pdfFile = await createPdfFromImages(imageFiles);
  return pdfFile.arrayBuffer();
};