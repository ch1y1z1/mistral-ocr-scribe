
import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Clipboard, Eye, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFileValidation } from '@/hooks/useFileValidation';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import {
  LazyDndContext,
  LazySortableContext,
  useLazySortable,
  LazyArrayMove,
  DndLoadingSpinner,
} from '@/lib/lazyImports';
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
  id: string;
  onRemove: (index: number) => void;
  onPreview: (index: number) => void;
}

const SortableFileItem = ({ file, index, id, onRemove, onPreview }: SortableFileItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging,
  } = useLazySortable({ id });

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
  onFileSelect: (file: File | File[] | null) => void;
  selectedFile: File | File[] | null;
}

const FileUpload = ({ onFileSelect, selectedFile }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // 使用自定义 hooks
  const { validateSingleFile, validateMultipleFiles } = useFileValidation();
  const { handleClipboardPaste } = useClipboardPaste({
    onFilesReceived: (files: File[]) => {
      if (files.length === 1) {
        onFileSelect(files[0]);
      } else {
        onFileSelect(files);
      }
    },
    selectedFile
  });
  
  // 为文件生成唯一 ID 的映射
  const [fileIds, setFileIds] = useState<Record<string, string>>({});
  
  // 生成唯一 ID
  const generateFileId = (file: File, index: number): string => {
    const key = `${file.name}-${file.size}-${file.lastModified}-${index}`;
    if (!fileIds[key]) {
      setFileIds(prev => ({ ...prev, [key]: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }));
    }
    return fileIds[key];
  };

  // 拖拽传感器
  const sensors = [
    { type: 'pointer' },
    { type: 'keyboard', options: { coordinateGetter: 'sortable' } }
  ];

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

    if (validateSingleFile(file)) {
      onFileSelect(file);
      toast({
        title: "文件上传成功",
        description: `已选择文件: ${file.name}`
      });
    }
  };

  const handleMultipleFileSelection = (files: File[]) => {
    if (!files.length) return;

    const { validFiles, invalidFiles, oversizedFiles } = validateMultipleFiles(files);

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
        onFileSelect(null);
      } else if (newFiles.length === 1) {
        // 当只剩一个文件时，转换为单文件模式
        onFileSelect(newFiles[0]);
      } else {
        onFileSelect(newFiles);
      }
    }
  };

  // 处理拖拽排序
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && Array.isArray(selectedFile)) {
      const oldIndex = selectedFile.findIndex((file, index) => generateFileId(file, index) === active.id);
      const newIndex = selectedFile.findIndex((file, index) => generateFileId(file, index) === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFiles = LazyArrayMove(selectedFile, oldIndex, newIndex);
        onFileSelect(newFiles);
      }
    }
  };

  // 处理预览
  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewModalOpen(true);
  };

  
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
          
          <LazyDndContext
            sensors={sensors}
            collisionDetection="closestCenter"
            onDragEnd={handleDragEnd}
          >
            <LazySortableContext
              items={selectedFile.map((file, index) => generateFileId(file, index))}
              strategy="vertical"
            >
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFile.map((file, index) => (
                  <SortableFileItem
                    key={generateFileId(file, index)}
                    file={file}
                    index={index}
                    id={generateFileId(file, index)}
                    onRemove={removeFileAtIndex}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </LazySortableContext>
          </LazyDndContext>
          
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
