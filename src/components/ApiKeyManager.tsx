
import { useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ApiKeyManagerProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ApiKeyManager = ({ apiKey, setApiKey }: ApiKeyManagerProps) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('mistral-api-key', value);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>API 配置</span>
        </CardTitle>
        <CardDescription>
          输入您的 Mistral API 密钥以使用 OCR 服务
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-gray-700">Mistral API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              placeholder="输入您的 API 密钥..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            API 密钥将安全保存在您的浏览器本地存储中
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyManager;
