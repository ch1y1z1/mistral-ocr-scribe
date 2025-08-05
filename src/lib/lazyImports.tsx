import { lazy, Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// 加载状态组件
export const DndLoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-sm text-gray-600">加载拖拽功能...</span>
  </div>
);

export const PdfLoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    <span className="ml-2 text-sm text-gray-600">处理PDF...</span>
  </div>
);

// 动态导入 dnd-kit 组件
export const LazyDndContext = lazy(() => import('@dnd-kit/core').then(mod => ({ default: mod.DndContext })));
export const LazySortableContext = lazy(() => import('@dnd-kit/sortable').then(mod => ({ default: mod.SortableContext })));

// 简单的排序钩子
export const useLazySortable = (props: any) => {
  const [sortableProps, setSortableProps] = useState<any>({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    style: {},
    isDragging: false,
  });

  useEffect(() => {
    import('@dnd-kit/sortable').then(mod => {
      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = mod.useSortable(props);
      const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
      };
      setSortableProps({ attributes, listeners, setNodeRef, style, isDragging });
    });
  }, [props]);

  return sortableProps;
};

// 简单的数组移动函数
export const LazyArrayMove = (array: any[], oldIndex: number, newIndex: number) => {
  const newArray = [...array];
  const [removed] = newArray.splice(oldIndex, 1);
  newArray.splice(newIndex, 0, removed);
  return newArray;
};

// 动态 PDF 工具函数
export const createPdfFromImages = async (imageFiles: File[]): Promise<File> => {
  const { PDFDocument } = await import('pdf-lib');
  
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
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG blob'));
          }
        }, 'image/png');
      });
      
      const pngArrayBuffer = await pngBlob.arrayBuffer();
      image = await pdfDoc.embedPng(pngArrayBuffer);
      
      // 清理对象URL
      URL.revokeObjectURL(img.src);
    }
    
    // 获取图片尺寸
    const imageDims = image.scale(1);
    
    // 创建新页面
    const page = pdfDoc.addPage([imageDims.width, imageDims.height]);
    
    // 在页面上绘制图片
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: imageDims.width,
      height: imageDims.height,
    });
  }

  // 保存PDF
  const pdfBytes = await pdfDoc.save();
  
  // 创建新的File对象
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const pdfFile = new File([pdfBlob], `combined-${Date.now()}.pdf`, { type: 'application/pdf' });
  
  return pdfFile;
};