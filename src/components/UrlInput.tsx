
import { useState } from 'react';
import { Link, ExternalLink, AlertTriangle } from 'lucide-react';
import { validateUrl } from '@/lib/security';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface UrlInputProps {
  onUrlInput: (url: string) => void;
  inputUrl: string;
}

const UrlInput = ({ onUrlInput, inputUrl }: UrlInputProps) => {
  const [tempUrl, setTempUrl] = useState(inputUrl);
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = () => {
    const trimmedUrl = tempUrl.trim();
    if (!trimmedUrl) return;

    // 验证URL安全性
    const validation = validateUrl(trimmedUrl);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid URL');
      return;
    }

    setValidationError('');
    onUrlInput(trimmedUrl);
  };

  const handleUrlChange = (value: string) => {
    setTempUrl(value);
    if (validationError) {
      setValidationError(''); // 清除错误当用户开始输入
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const exampleUrls = [
    {
      name: "示例 PDF",
      url: "https://arxiv.org/pdf/2501.12948",
      type: "PDF"
    },
    {
      name: "示例图片",
      url: "https://huggingface.co/datasets/agents-course/course-images/resolve/main/en/unit0/recommended-pace.jpg",
      type: "图片"
    }
  ];

  return (
    <div className="space-y-4">
      {!inputUrl ? (
        <div className="space-y-2">
          <Label htmlFor="url-input" className="text-sm font-medium text-gray-700">
            输入图片或PDF的URL
          </Label>
          <div className="flex space-x-2">
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/document.pdf 或 image.jpg"
              value={tempUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`flex-1 text-sm ${
                validationError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            <Button 
              onClick={handleSubmit}
              disabled={!tempUrl.trim()}
              size="sm"
              className="px-3"
            >
              <Link className="w-4 h-4" />
            </Button>
          </div>
          {validationError && (
            <div className="flex items-center space-x-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{validationError}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <ExternalLink className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm md:text-base">URL 输入</p>
              <p className="text-xs md:text-sm text-gray-500 truncate">{inputUrl}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempUrl('');
              onUrlInput('');
            }}
            className="text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"
          >
            <span className="sr-only">移除URL</span>
            ×
          </Button>
        </div>
      )}

      {!inputUrl && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              或选择示例URL
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {exampleUrls.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const validation = validateUrl(example.url);
                    if (validation.isValid) {
                      setTempUrl(example.url);
                      onUrlInput(example.url);
                      setValidationError('');
                    } else {
                      setValidationError(validation.error || 'Invalid URL');
                    }
                  }}
                  className="justify-start text-left p-2 md:p-3 h-auto"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs md:text-sm">{example.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {example.url}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• 支持的图片格式：JPG, JPEG, PNG, GIF, BMP, WebP</p>
            <p>• 支持的文档格式：PDF</p>
            <p>• 请确保URL可以公开访问</p>
          </div>
        </>
      )}
    </div>
  );
};

export default UrlInput;
