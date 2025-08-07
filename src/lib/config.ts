// 应用配置常量

export const CONFIG = {
  // 文件配置
  FILE: {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
    MAX_COUNT: 50,
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'application/pdf'
    ] as const,
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] as const,
    SUPPORTED_DOCUMENT_FORMATS: ['pdf'] as const,
  },
  
  // UI 配置
  UI: {
    PREVIEW_MODAL_MAX_IMAGES: 100,
    FILE_LIST_MAX_HEIGHT: '48vh',
    TOAST_DURATION: 5000,
  },
  
  // 性能配置
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    MEMORY_CLEANUP_INTERVAL: 60000, // 1分钟
  },
  
  // 安全配置
  SECURITY: {
    SANITIZE_FILENAMES: true,
    MAX_FILENAME_LENGTH: 255,
    ALLOWED_FILENAME_CHARS: /^[a-zA-Z0-9._\-[\]() ]+$/,
  },
} as const;

// 文件头签名常量
export const FILE_HEADERS = {
  JPEG: 'FFD8FF',
  PNG: '89504E47',
  GIF: '47494638',
  BMP: '424D',
  WEBP_RIFF: '52494646',
  WEBP_WEBP: '52494658',
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: (maxSize: number) => `文件大小不能超过 ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
  FILE_TYPE_NOT_SUPPORTED: (fileType: string) => `不支持 ${fileType} 格式，请选择支持的文件格式`,
  FILE_EXTENSION_MISMATCH: '文件扩展名与内容类型不匹配',
  FILE_CONTENT_VALIDATION_FAILED: '文件内容与声明的类型不匹配',
  CLIPBOARD_PERMISSION_DENIED: '剪切板访问权限被拒绝，请在浏览器设置中允许剪切板访问权限',
  CLIPBOARD_NO_IMAGES: '剪切板中没有图片，请复制图片后再粘贴',
  CLIPBOARD_READ_FAILED: '剪切板读取失败',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: (fileName: string) => `文件上传成功：${fileName}`,
  FILES_UPLOADED: (count: number) => `已选择 ${count} 个图片文件`,
  CLIPBOARD_IMAGE_ADDED: (fileName: string, count: number) => `已添加图片：${fileName}，当前共 ${count} 张图片`,
  CLIPBOARD_IMAGE_READ: (fileName: string, size: number) => `已读取图片：${fileName} (${(size / 1024 / 1024).toFixed(2)} MB)`,
} as const;