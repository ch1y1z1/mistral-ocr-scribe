import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFileValidationProps {
  maxSize?: number;
  allowedTypes?: string[];
}

export const useFileValidation = ({ 
  maxSize = 20 * 1024 * 1024, // 20MB
  allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf'
  ]
}: UseFileValidationProps = {}) => {
  const { toast } = useToast();

  const validateSingleFile = useCallback((file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "文件格式不支持",
        description: `不支持 ${file.type} 格式，请选择支持的文件格式`,
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "文件过大",
        description: `文件大小不能超过 ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [allowedTypes, maxSize, toast]);

  const validateMultipleFiles = useCallback((files: File[]): { validFiles: File[]; invalidFiles: string[]; oversizedFiles: string[] } => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];

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
        description: `以下文件将被忽略：${oversizedFiles.join(', ')}。单个文件不能超过${(maxSize / 1024 / 1024).toFixed(0)}MB`,
        variant: "destructive"
      });
    }

    return { validFiles, invalidFiles, oversizedFiles };
  }, [allowedTypes, maxSize, toast]);

  return {
    validateSingleFile,
    validateMultipleFiles
  };
};