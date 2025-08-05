
import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Clipboard, Eye, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ImagePreviewModal from './ImagePreviewModal';

interface SingleFileDisplayProps {
  file: File;
  onRemove: () => void;
  onPreview: () => void;
}

const SingleFileDisplay = ({ file, onRemove, onPreview }: SingleFileDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
        {/* 文件图标或缩略图 */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={file.name}
              className="w-10 h-10 md:w-12 md:h-12 object-cover rounded border border-gray-200"
            />
          ) : file.type.startsWith('image/') ? (
            <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-blue-600 p-2 border border-gray-200 rounded" />
          ) : (
            <FileText className="w-10 h-10 md:w-12 md:h-12 text-red-600 p-2 border border-gray-200 rounded" />
          )}
        </div>
        
        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm md:text-base truncate">{file.name}</p>
          <p className="text-xs md:text-sm text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center space-x-1">
        {file.type.startsWith('image/') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreview}
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
            title="预览图片"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
          title="删除文件"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface SortableFileItemProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
  onPreview: (index: number) => void;
}

const SortableFileItem = ({ file, index, onRemove, onPreview }: SortableFileItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.name + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* 图片缩略图或图标 */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={file.name}
              className="w-10 h-10 object-cover rounded border border-gray-200"
            />
          ) : (
            <ImageIcon className="w-10 h-10 text-blue-600 p-2 border border-gray-200 rounded" />
          )}
        </div>
        
        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
          <p className="text-xs text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center space-x-1">
        {file.type.startsWith('image/') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(index)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
            title="预览图片"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
          title="删除文件"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface FileUploadProps {
  onFileSelect: (file: File | File[]) => void;
  selectedFile: File | File[] | null;
}

const FileUpload = ({ onFileSelect, selectedFile }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    if (files.length > 1) {
      handleMultipleFileSelection(files);
    } else {
      handleFileSelection(files[0]);
    }
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

  const handleMultipleFileSelection = (files: File[]) => {
    if (!files.length) return;

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'
    ];

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];

    const maxSize = 20 * 1024 * 1024; // 20MB

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
      } else if (file.size > maxSize) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "部分文件格式不支持",
        description: `以下文件将被忽略：${invalidFiles.join(', ')}。仅支持图片文件（JPG, PNG, GIF, BMP, WebP）`,
        variant: "destructive"
      });
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: "部分文件过大",
        description: `以下文件将被忽略：${oversizedFiles.join(', ')}。单个文件不能超过20MB`,
        variant: "destructive"
      });
    }

    if (validFiles.length === 0) {
      toast({
        title: "没有有效文件",
        description: "请选择有效的图片文件",
        variant: "destructive"
      });
      return;
    }

    onFileSelect(validFiles);
    toast({
      title: "文件上传成功",
      description: `已选择 ${validFiles.length} 个图片文件`
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length > 1) {
        handleMultipleFileSelection(Array.from(files));
      } else {
        const file = files[0];
        if (file) {
          handleFileSelection(file);
        }
      }
    }
  };

  const removeFile = () => {
    onFileSelect(null as unknown as File);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFileAtIndex = (index: number) => {
    if (Array.isArray(selectedFile)) {
      const newFiles = selectedFile.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        onFileSelect(null as unknown as File);
      } else if (newFiles.length === 1) {
        // 当只剩一个文件时，转换为单文件模式
        onFileSelect(newFiles[0]);
      } else {
        onFileSelect(newFiles);
      }
    }
  };

  // 处理拖拽排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && Array.isArray(selectedFile)) {
      const oldIndex = selectedFile.findIndex((file, index) => file.name + index === active.id);
      const newIndex = selectedFile.findIndex((file, index) => file.name + index === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFiles = arrayMove(selectedFile, oldIndex, newIndex);
        onFileSelect(newFiles);
      }
    }
  };

  // 处理预览
  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewModalOpen(true);
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
          
          // 根据当前状态处理文件
          if (Array.isArray(selectedFile)) {
            // 已有多个文件：添加到现有文件列表
            const newFiles = [...selectedFile, file];
            onFileSelect(newFiles);
            
            toast({
              title: "剪切板图片添加成功",
              description: `已添加图片: ${fileName}，当前共 ${newFiles.length} 张图片`
            });
          } else if (selectedFile) {
            // 已有单个文件：询问用户是否要替换还是添加
            const newFiles = [selectedFile, file];
            onFileSelect(newFiles);
            
            toast({
              title: "切换到多图片模式",
              description: `已添加第二张图片，当前共 ${newFiles.length} 张图片`
            });
          } else {
            // 没有文件：直接设置
            onFileSelect(file);
            
            toast({
              title: "剪切板图片读取成功",
              description: `已读取图片: ${fileName} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`
            });
          }
          
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
  }, [onFileSelect, toast, selectedFile]);

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
        // 始终允许粘贴图片，自动处理单/多文件模式
        e.preventDefault();
        handleClipboardPaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClipboardPaste]);

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
            提示：按 Ctrl+V (Mac: Cmd+V) 可快速粘贴剪切板中的图片，支持多次粘贴
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
            multiple
            onChange={handleFileInputChange}
          />
        </div>
      ) : Array.isArray(selectedFile) ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-700">
                已选择 {selectedFile.length} 个文件
              </p>
              <span className="text-xs text-gray-500 px-2 py-1 bg-blue-50 rounded-full">
                可拖拽排序
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
              <span className="ml-1">全部清除</span>
            </Button>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedFile.map((file, index) => file.name + index)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFile.map((file, index) => (
                  <SortableFileItem
                    key={file.name + index}
                    file={file}
                    index={index}
                    onRemove={removeFileAtIndex}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {/* 预览模态框 */}
          <ImagePreviewModal
            isOpen={previewModalOpen}
            onClose={() => setPreviewModalOpen(false)}
            images={selectedFile.filter(file => file.type.startsWith('image/'))}
            initialIndex={previewIndex}
          />
        </div>
      ) : (
        <SingleFileDisplay 
          file={selectedFile}
          onRemove={removeFile}
          onPreview={() => handlePreview(0)}
        />
      )}
      
      {/* 单文件预览模态框 */}
      {!Array.isArray(selectedFile) && selectedFile && selectedFile.type.startsWith('image/') && (
        <ImagePreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          images={[selectedFile]}
          initialIndex={0}
        />
      )}
    </div>
  );
};

export default FileUpload;
