
import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

const FileUpload = ({ onFileSelect, selectedFile }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files[0]);
  };

  const handleFileSelection = (file: File) => {
    if (!file) return;

    // 支持图片和PDF格式
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "文件格式不支持",
        description: "目前支持图片文件（JPG, PNG, GIF, BMP, WebP）和 PDF 文件",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 20 * 1024 * 1024; // 20MB for PDFs
    if (file.size > maxSize) {
      toast({
        title: "文件过大",
        description: "文件大小不能超过20MB",
        variant: "destructive"
      });
      return;
    }

    onFileSelect(file);
    toast({
      title: "文件上传成功",
      description: `已选择文件: ${file.name}`
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const removeFile = () => {
    onFileSelect(null as unknown as File);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClipboardPaste = useCallback(async () => {
    try {
      // 检查剪切板 API 是否可用
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast({
          title: "不支持剪切板访问",
          description: "您的浏览器不支持剪切板 API，请使用 Chrome、Firefox 或 Safari 等现代浏览器",
          variant: "destructive"
        });
        return;
      }

      // 检查权限
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
      if (permission.state === 'denied') {
        toast({
          title: "剪切板访问被拒绝",
          description: "请在浏览器设置中允许访问剪切板，或使用传统的文件上传方式",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "正在读取剪切板",
        description: "正在尝试从剪切板获取图片..."
      });

      // 读取剪切板内容
      const clipboardItems = await navigator.clipboard.read();
      
      if (clipboardItems.length === 0) {
        toast({
          title: "剪切板为空",
          description: "剪切板中没有内容，请先复制一张图片",
          variant: "destructive"
        });
        return;
      }

      let imageFound = false;
      
      for (const clipboardItem of clipboardItems) {
        // 查找图片类型
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length === 0) {
          continue;
        }

        // 使用第一个图片类型
        const imageType = imageTypes[0];
        
        try {
          const blob = await clipboardItem.getType(imageType);
          
          // 验证是否是支持的图片格式
          const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
          if (!supportedTypes.includes(imageType)) {
            toast({
              title: "图片格式不支持",
              description: `检测到 ${imageType} 格式，目前支持 JPG、PNG、GIF、BMP、WebP 格式`,
              variant: "destructive"
            });
            continue;
          }

          // 检查文件大小
          const maxSize = 20 * 1024 * 1024; // 20MB
          if (blob.size > maxSize) {
            toast({
              title: "图片过大",
              description: `图片大小 ${(blob.size / 1024 / 1024).toFixed(2)} MB，不能超过 20MB`,
              variant: "destructive"
            });
            continue;
          }

          // 生成文件名
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const extension = imageType.split('/')[1] || 'png';
          const fileName = `clipboard-image-${timestamp}.${extension}`;

          // 创建 File 对象
          const file = new File([blob], fileName, { type: imageType });
          
          // 调用文件选择回调
          onFileSelect(file);
          
          toast({
            title: "剪切板图片读取成功",
            description: `已读取图片: ${fileName} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`
          });
          
          imageFound = true;
          break;
          
        } catch (error) {
          console.error('读取剪切板图片时出错:', error);
          toast({
            title: "读取图片失败",
            description: `无法读取 ${imageType} 格式的图片: ${error instanceof Error ? error.message : '未知错误'}`,
            variant: "destructive"
          });
        }
      }

      if (!imageFound) {
        toast({
          title: "未找到图片",
          description: "剪切板中没有找到支持的图片格式，请复制一张图片后重试",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('剪切板访问错误:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "剪切板访问被拒绝",
            description: "请在浏览器设置中允许访问剪切板，或点击地址栏的剪切板图标允许访问",
            variant: "destructive"
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "剪切板为空",
            description: "剪切板中没有内容，请先复制一张图片",
            variant: "destructive"
          });
        } else {
          toast({
            title: "剪切板读取失败",
            description: `发生错误: ${error.message}`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "剪切板读取失败",
          description: "无法访问剪切板，请使用文件上传方式",
          variant: "destructive"
        });
      }
    }
  }, [onFileSelect, toast]);

  // 处理剪切板粘贴按钮点击，防止冒泡触发文件选择
  const handleClipboardButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClipboardPaste();
  };

  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否按下了 Ctrl+V 或 Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // 只有在没有选择文件时才响应快捷键
        if (!selectedFile) {
          e.preventDefault();
          handleClipboardPaste();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFile, handleClipboardPaste]);

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-sm md:text-lg font-medium text-gray-700 mb-1 md:mb-2">
            拖拽文件到此处或点击上传
          </p>
          <p className="text-xs md:text-sm text-gray-500 mb-2">
            支持 JPG, PNG, GIF, BMP, WebP, PDF 格式（最大 20MB）
          </p>
          <p className="text-xs text-gray-400 mb-3 md:mb-4">
            提示：按 Ctrl+V (Mac: Cmd+V) 可快速粘贴剪切板中的图片
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClipboardButtonClick}
              className="flex items-center space-x-2 bg-white/80 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
            >
              <Clipboard className="w-4 h-4" />
              <span>从剪切板粘贴图片</span>
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
            ) : (
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm md:text-base truncate">{selectedFile.name}</p>
              <p className="text-xs md:text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
