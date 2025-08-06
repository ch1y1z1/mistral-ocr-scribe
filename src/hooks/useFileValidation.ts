import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CONFIG, FILE_HEADERS, ERROR_MESSAGES } from '@/lib/config';

// 文件头验证器
const validateFileContent = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      const header = Array.from(arr.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      // 根据文件类型验证文件头
      const isValidHeader = isValidImageHeader(header, file.type);
      resolve(isValidHeader);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

// 验证图片文件头
const isValidImageHeader = (header: string, mimeType: string): boolean => {
  const imageHeaders: Record<string, string[]> = {
    'image/jpeg': [FILE_HEADERS.JPEG],
    'image/jpg': [FILE_HEADERS.JPEG],
    'image/png': [FILE_HEADERS.PNG],
    'image/gif': [FILE_HEADERS.GIF],
    'image/bmp': [FILE_HEADERS.BMP],
    'image/webp': [FILE_HEADERS.WEBP_RIFF, FILE_HEADERS.WEBP_WEBP],
  };
  
  const validHeaders = imageHeaders[mimeType] || [];
  return validHeaders.some(validHeader => header.startsWith(validHeader));
};

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// 验证文件扩展名与类型是否匹配
const validateFileExtension = (file: File): boolean => {
  const extension = getFileExtension(file.name);
  const typeToExtension: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/bmp': ['bmp'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
  };
  
  const validExtensions = typeToExtension[file.type] || [];
  return validExtensions.includes(extension);
};

interface UseFileValidationProps {
  maxSize?: number;
  allowedTypes?: string[];
}

export const useFileValidation = ({ 
  maxSize = CONFIG.FILE.MAX_SIZE,
  allowedTypes = [...CONFIG.FILE.ALLOWED_TYPES]
}: UseFileValidationProps = {}) => {
  const { toast } = useToast();

  const validateSingleFile = useCallback(async (file: File): Promise<boolean> => {
    // 基础类型验证
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "文件格式不支持",
        description: ERROR_MESSAGES.FILE_TYPE_NOT_SUPPORTED(file.type),
        variant: "destructive"
      });
      return false;
    }

    // 扩展名验证
    if (!validateFileExtension(file)) {
      toast({
        title: "文件扩展名不匹配",
        description: ERROR_MESSAGES.FILE_EXTENSION_MISMATCH,
        variant: "destructive"
      });
      return false;
    }

    // 文件大小验证
    if (file.size > maxSize) {
      toast({
        title: "文件过大",
        description: ERROR_MESSAGES.FILE_TOO_LARGE(maxSize),
        variant: "destructive"
      });
      return false;
    }

    // 文件内容验证（仅对图片文件）
    if (file.type.startsWith('image/')) {
      try {
        const isValidContent = await validateFileContent(file);
        if (!isValidContent) {
          toast({
            title: "文件内容验证失败",
            description: ERROR_MESSAGES.FILE_CONTENT_VALIDATION_FAILED,
            variant: "destructive"
          });
          return false;
        }
      } catch (error) {
        console.warn('文件内容验证失败:', error);
        // 如果内容验证失败，但不阻止文件上传
        toast({
          title: "文件内容验证警告",
          description: "无法验证文件内容，但允许继续上传",
          variant: "default"
        });
      }
    }

    return true;
  }, [allowedTypes, maxSize, toast]);

  const validateMultipleFiles = useCallback(async (files: File[]): Promise<{ validFiles: File[]; invalidFiles: string[]; oversizedFiles: string[]; extensionMismatchFiles: string[]; contentValidationFailedFiles: string[] }> => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const extensionMismatchFiles: string[] = [];
    const contentValidationFailedFiles: string[] = [];

    for (const file of files) {
      // 基础类型验证
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name);
        continue;
      }

      // 扩展名验证
      if (!validateFileExtension(file)) {
        extensionMismatchFiles.push(file.name);
        continue;
      }

      // 文件大小验证
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
        continue;
      }

      // 文件内容验证（仅对图片文件）
      if (file.type.startsWith('image/')) {
        try {
          const isValidContent = await validateFileContent(file);
          if (!isValidContent) {
            contentValidationFailedFiles.push(file.name);
            continue;
          }
        } catch (error) {
          console.warn(`文件内容验证失败 ${file.name}:`, error);
          // 如果内容验证失败，但不阻止文件上传
        }
      }

      validFiles.push(file);
    }

    // 显示各种错误信息
    if (invalidFiles.length > 0) {
      toast({
        title: "部分文件格式不支持",
        description: `以下文件将被忽略：${invalidFiles.join(', ')}。仅支持图片文件（JPG, PNG, GIF, BMP, WebP）`,
        variant: "destructive"
      });
    }

    if (extensionMismatchFiles.length > 0) {
      toast({
        title: "部分文件扩展名不匹配",
        description: `以下文件将被忽略：${extensionMismatchFiles.join(', ')}。文件扩展名与内容类型不匹配`,
        variant: "destructive"
      });
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: "部分文件过大",
        description: `以下文件将被忽略：${oversizedFiles.join(', ')}。单个文件不能超过${(maxSize / 1024 / 1024).toFixed(0)}MB`,
        variant: "destructive"
      });
    }

    if (contentValidationFailedFiles.length > 0) {
      toast({
        title: "部分文件内容验证失败",
        description: `以下文件将被忽略：${contentValidationFailedFiles.join(', ')}。文件内容与声明的类型不匹配`,
        variant: "destructive"
      });
    }

    return { validFiles, invalidFiles, oversizedFiles, extensionMismatchFiles, contentValidationFailedFiles };
  }, [allowedTypes, maxSize, toast]);

  return {
    validateSingleFile,
    validateMultipleFiles
  };
};