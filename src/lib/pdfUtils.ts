import { PDFDocument, rgb } from 'pdf-lib';

export const convertImagesToPdf = async (imageFiles: File[]): Promise<Uint8Array> => {
  // 创建新的PDF文档
  const pdfDoc = await PDFDocument.create();

  for (const imageFile of imageFiles) {
    // 将图片文件转换为ArrayBuffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    
    let image;
    
    // 根据图片类型嵌入图片
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageArrayBuffer);
    } else if (imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(imageArrayBuffer);
    } else {
      // 对于其他格式（gif, bmp, webp），需要先转换为支持的格式
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(imageFile);
      });
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      // 转换为PNG格式的blob
      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });
      
      const pngArrayBuffer = await pngBlob.arrayBuffer();
      image = await pdfDoc.embedPng(pngArrayBuffer);
      
      // 清理对象URL
      URL.revokeObjectURL(img.src);
    }
    
    // 获取图片尺寸
    const imageDims = image.scale(1);
    
    // 创建新页面，根据图片尺寸调整页面大小
    const page = pdfDoc.addPage([imageDims.width, imageDims.height]);
    
    // 将图片绘制到页面上
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: imageDims.width,
      height: imageDims.height,
    });
  }
  
  // 保存PDF文档
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

export const createPdfFromImages = async (imageFiles: File[]): Promise<File> => {
  const pdfBytes = await convertImagesToPdf(imageFiles);
  
  // 创建PDF文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `merged-images-${timestamp}.pdf`;
  
  const pdfFile = new File([pdfBytes], fileName, {
    type: 'application/pdf'
  });
  
  return pdfFile;
};