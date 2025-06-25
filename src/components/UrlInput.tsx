
import { useState } from 'react';
import { Link, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface UrlInputProps {
  onUrlInput: (url: string) => void;
  inputUrl: string;
}

const UrlInput = ({ onUrlInput, inputUrl }: UrlInputProps) => {
  const [tempUrl, setTempUrl] = useState(inputUrl);

  const handleSubmit = () => {
    if (tempUrl.trim()) {
      onUrlInput(tempUrl.trim());
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
      <div className="space-y-2">
        <Label htmlFor="url-input" className="text-sm font-medium text-gray-700">
          输入图片或PDF的URL
        </Label>
        <div className="flex space-x-2">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com/document.pdf 或 https://example.com/image.jpg"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSubmit}
            disabled={!tempUrl.trim()}
            size="sm"
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
                setTempUrl(example.url);
                onUrlInput(example.url);
              }}
              className="justify-start text-left p-3 h-auto"
            >
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">{example.name}</div>
                  <div className="text-xs text-gray-500 truncate max-w-64">
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
    </div>
  );
};

export default UrlInput;
