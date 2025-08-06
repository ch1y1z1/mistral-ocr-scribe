import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// 请求剪切板权限的辅助函数
const requestClipboardPermission = async (): Promise<boolean> => {
  try {
    // 尝试通过用户交互请求权限
    // 注意：这通常需要用户手势触发
    return false; // 在实际应用中，可以通过 UI 交互请求权限
  } catch (error) {
    console.warn('Failed to request clipboard permission:', error);
    return false;
  }
};

interface UseClipboardPasteProps {
  onFilesReceived: (files: File[]) => void;
  selectedFile: File | File[] | null;
}

export const useClipboardPaste = ({ onFilesReceived, selectedFile }: UseClipboardPasteProps) => {
  const { toast } = useToast();

  const handleClipboardPaste = useCallback(async () => {
    try {
      // 检查剪切板 API 是否可用
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast({
          title: "剪切板访问失败",
          description: "您的浏览器不支持剪切板访问功能",
          variant: "destructive"
        });
        return;
      }

      // 检查剪切板权限
      let permissionGranted = false;
      try {
        const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
        if (permission.state === 'granted') {
          permissionGranted = true;
        } else if (permission.state === 'prompt') {
          // 尝试请求权限
          permissionGranted = await requestClipboardPermission();
        }
      } catch (permissionError) {
        // 如果权限 API 不可用，尝试直接读取
        console.warn('Clipboard permission API not available, trying direct access');
        permissionGranted = true; // 允许尝试直接读取
      }

      if (!permissionGranted) {
        toast({
          title: "剪切板访问权限被拒绝",
          description: "请在浏览器设置中允许剪切板访问权限",
          variant: "destructive"
        });
        return;
      }

      // 读取剪切板内容
      const clipboardItems = await navigator.clipboard.read();
      
      let imageFound = false;

      for (const item of clipboardItems) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          // 获取第一个图片类型的 blob
          const blob = await item.getType(imageTypes[0]);
          
          // 生成文件名
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const extension = imageTypes[0].split('/')[1] || 'png';
          const fileName = `clipboard-${timestamp}.${extension}`;
          const imageType = imageTypes[0];
          
          // 创建 File 对象
          const file = new File([blob], fileName, { type: imageType });
          
          // 根据当前状态处理文件
          if (Array.isArray(selectedFile)) {
            // 已有多个文件：添加到现有文件列表
            const newFiles = [...selectedFile, file];
            onFilesReceived(newFiles);
            
            toast({
              title: "剪切板图片添加成功",
              description: `已添加图片: ${fileName}，当前共 ${newFiles.length} 张图片`
            });
          } else if (selectedFile) {
            // 已有单个文件：询问用户是否要替换还是添加
            const newFiles = [selectedFile, file];
            onFilesReceived(newFiles);
            
            toast({
              title: "切换到多图片模式",
              description: `已添加第二张图片，当前共 ${newFiles.length} 张图片`
            });
          } else {
            // 没有文件：直接设置
            onFilesReceived([file]);
            
            toast({
              title: "剪切板图片读取成功",
              description: `已读取图片: ${fileName} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`
            });
          }
          
          imageFound = true;
          break;
        }
      }

      if (!imageFound) {
        toast({
          title: "剪切板中没有图片",
          description: "请复制图片后再粘贴",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('剪切板读取失败:', error);
      
      let errorMessage = "剪切板读取失败";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "剪切板访问权限被拒绝，请在浏览器设置中允许剪切板访问";
        } else if (error.name === 'DataError') {
          errorMessage = "剪切板中没有有效的图片数据";
        } else {
          errorMessage = `剪切板读取失败: ${error.message}`;
        }
      }
      
      toast({
        title: "剪切板读取失败",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [onFilesReceived, selectedFile, toast]);

  return {
    handleClipboardPaste
  };
};