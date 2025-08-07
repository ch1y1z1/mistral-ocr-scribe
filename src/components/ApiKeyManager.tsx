import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { encryptData, decryptData, getBrowserFingerprint } from '@/lib/security';
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
  const [isEncrypted, setIsEncrypted] = useState(false);

  // 检查现有密钥是否加密
  useEffect(() => {
    const checkEncryption = async () => {
      const storedKey = localStorage.getItem('mistral-api-key-encrypted');
      if (storedKey && !apiKey) {
        setIsEncrypted(true);
        // 尝试自动解密（使用浏览器指纹）
        try {
          const fingerprint = await getBrowserFingerprint();
          const decrypted = await decryptData(storedKey, fingerprint);
          setApiKey(decrypted);
        } catch (error) {
          console.log('Auto-decryption failed, user will need to re-enter key');
        }
      }
    };
    checkEncryption();
  }, [setApiKey]);

  const handleApiKeyChange = async (value: string) => {
    setApiKey(value);
    
    if (value) {
      try {
        // 加密并存储API密钥
        const fingerprint = await getBrowserFingerprint();
        const encrypted = await encryptData(value, fingerprint);
        localStorage.setItem('mistral-api-key-encrypted', encrypted);
        localStorage.removeItem('mistral-api-key'); // 移除旧的明文存储
        setIsEncrypted(true);
      } catch (error) {
        console.error('Failed to encrypt API key:', error);
        // 如果加密失败，回退到明文存储（不推荐）
        localStorage.setItem('mistral-api-key', value);
        setIsEncrypted(false);
      }
    } else {
      // 清除所有存储的密钥
      localStorage.removeItem('mistral-api-key');
      localStorage.removeItem('mistral-api-key-encrypted');
      setIsEncrypted(false);
    }
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
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs rounded-full border border-emerald-200/50 shadow-sm">
                  已配置
                </span>
                {isEncrypted && (
                  <div className="flex items-center px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs rounded-full border border-blue-200/50 shadow-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>已加密</span>
                  </div>
                )}
              </div>
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
            ? `API密钥${apiKey ? '已配置' : '未配置'}${isEncrypted ? ' (已加密)' : ''} - 点击展开设置`
            : "输入您的 Mistral API 密钥以使用 OCR 服务。密钥将被加密存储以确保安全。"
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
            <div className="flex items-start space-x-2 text-xs text-gray-500">
              <Shield className="w-3 h-3 mt-0.5 text-blue-500" />
              <div>
                <p>API 密钥使用浏览器指纹进行加密，安全保存在本地存储中</p>
                <p className="mt-1">加密确保即使本地存储被访问，您的密钥也保持安全</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ApiKeyManager;