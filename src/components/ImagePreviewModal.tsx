import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: File[];
  initialIndex: number;
}

const ImagePreviewModal = ({ isOpen, onClose, images, initialIndex }: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // 生成图片URL
  useEffect(() => {
    if (images.length > 0) {
      const urls = images.map(file => URL.createObjectURL(file));
      setImageUrls(urls);
      
      // 清理函数
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [images]);

  // 更新当前索引
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!images.length || currentIndex >= images.length) return null;

  const currentImage = images[currentIndex];
  const currentImageUrl = imageUrls[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden [&>button]:hidden"
      >
        <DialogHeader className="px-6 py-4 border-b relative">
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="text-lg font-semibold">图片预览</span>
              <span className="ml-3 text-sm text-gray-500">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevious}
                    className="h-8 w-8 p-0"
                    title="上一张图片"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNext}
                    className="h-8 w-8 p-0"
                    title="下一张图片"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                title="关闭预览"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="relative max-w-full max-h-full">
            {currentImageUrl && (
              <img
                src={currentImageUrl}
                alt={currentImage.name}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 truncate max-w-xs">
                {currentImage.name}
              </p>
              <p className="text-sm text-gray-500">
                {(currentImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex
                        ? 'bg-blue-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;