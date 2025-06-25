
import { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
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
    onFileSelect(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
          <p className="text-xs md:text-sm text-gray-500">
            支持 JPG, PNG, GIF, BMP, WebP, PDF 格式（最大 20MB）
          </p>
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
