import { useState } from 'react';
import { Settings, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(!!apiKey); // 如果已有API密钥则默认折叠

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('mistral-api-key', value);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/98">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span>API 配置</span>
            {apiKey && (
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs rounded-full border border-emerald-200/50 shadow-sm">
                已配置
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-6 w-6"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
          </Button>
        </div>
        <CardDescription>
          {isCollapsed 
            ? `API密钥${apiKey ? '已配置' : '未配置'} - 点击展开设置`
            : "输入您的 Mistral API 密钥以使用 OCR 服务"
          }
        </CardDescription>
      </CardHeader>
      {!isCollapsed && (
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
      )}
    </Card>
  );
};

export default ApiKeyManager;