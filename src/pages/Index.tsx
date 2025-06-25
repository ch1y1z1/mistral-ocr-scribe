import { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, Copy, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import ApiKeyManager from '@/components/ApiKeyManager';
import OcrResults from '@/components/OcrResults';

const Index = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mistral-api-key') || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setOcrResult('');
    
    if (file) {
      toast({
        title: "文件选择成功",
        description: `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  // Upload PDF file to Mistral and get file URL
  const uploadPdfFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'ocr');

    console.log('开始上传 PDF 文件...');
    toast({
      title: "PDF 文件上传",
      description: "正在上传 PDF 到 Mistral 服务器..."
    });

    const uploadStart = Date.now();
    const response = await fetch('https://api.mistral.ai/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    const uploadTime = Date.now() - uploadStart;
    console.log(`PDF 上传耗时: ${uploadTime}ms`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('PDF 上传失败:', errorData);
      throw new Error(errorData.error?.message || `文件上传失败: ${response.status}`);
    }

    const uploadResult = await response.json();
    console.log('PDF 上传成功:', uploadResult);

    toast({
      title: "PDF 上传完成",
      description: `上传耗时: ${uploadTime}ms，文件ID: ${uploadResult.id}`
    });

    // 直接使用文件 ID 构建 document_url，而不是获取签名 URL
    return `mistral://files/${uploadResult.id}`;
  };

  const processOCR = async () => {
    if (!selectedFile || !apiKey) {
      toast({
        title: "错误",
        description: "请选择文件并输入API密钥",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    toast({
      title: "开始 OCR 处理",
      description: "正在准备文件..."
    });

    try {
      let documentSource: any = null;

      if (selectedFile.type === 'application/pdf') {
        // PDF 文件处理
        const documentUrl = await uploadPdfFile(selectedFile);
        
        documentSource = {
          type: "document_url",
          document_url: documentUrl
        };
        
        console.log('PDF 文档源:', documentSource);
      } else {
        // 图片文件处理
        const startConversion = Date.now();
        toast({
          title: "图片转换",
          description: "正在将图片转换为 Base64 格式..."
        });

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(selectedFile);
        });

        const conversionTime = Date.now() - startConversion;
        console.log(`图片转换耗时: ${conversionTime}ms`);
        
        toast({
          title: "图片转换完成",
          description: `Base64 转换耗时: ${conversionTime}ms`
        });

        documentSource = {
          type: "image_url",
          image_url: `data:${selectedFile.type};base64,${base64}`
        };
      }

      console.log('准备发送 OCR API 请求...');
      console.log('文件类型:', selectedFile.type);
      console.log('文件大小:', selectedFile.size, 'bytes');

      const requestStart = Date.now();
      toast({
        title: "调用 OCR API",
        description: "正在发送请求到 Mistral OCR..."
      });

      const ocrPayload = {
        model: 'mistral-ocr-2505',
        document: documentSource,
        include_image_base64: false
      };

      console.log('OCR 请求载荷:', JSON.stringify(ocrPayload, null, 2));

      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(ocrPayload)
      });

      const requestTime = Date.now() - requestStart;
      console.log('OCR API 响应状态:', response.status);
      console.log('OCR API 请求耗时:', requestTime, 'ms');

      toast({
        title: "收到 OCR 响应",
        description: `请求耗时: ${requestTime}ms，状态: ${response.status}`
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OCR API 错误响应:', errorData);
        
        toast({
          title: "OCR API 失败",
          description: `状态: ${response.status}, 错误: ${errorData.error?.message || '未知错误'}`,
          variant: "destructive"
        });
        
        throw new Error(errorData.error?.message || `OCR API请求失败: ${response.status}`);
      }

      const parseStart = Date.now();
      toast({
        title: "解析响应",
        description: "正在处理 OCR 结果..."
      });

      const data = await response.json();
      const parseTime = Date.now() - parseStart;
      
      console.log('OCR 响应数据:', data);
      console.log('响应解析耗时:', parseTime, 'ms');
      
      let extractedText = '';
      if (data.pages && data.pages.length > 0) {
        extractedText = data.pages.map((page: any) => page.markdown || '').join('\n\n').trim();
      }
      
      if (!extractedText) {
        extractedText = '未能提取到文字内容';
        toast({
          title: "警告",
          description: "没有识别到任何文字内容",
          variant: "destructive"
        });
      }
      
      setOcrResult(extractedText);
      
      const totalTime = requestTime + parseTime;
      toast({
        title: "OCR 完成",
        description: `总耗时: ${totalTime}ms，识别 ${extractedText.length} 个字符`
      });

      console.log('OCR 处理完成，总耗时:', totalTime, 'ms');
      console.log('提取的文字长度:', extractedText.length);
      
    } catch (error) {
      console.error('OCR处理错误:', error);
      toast({
        title: "OCR 失败",
        description: error instanceof Error ? error.message : '处理过程中发生错误',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      toast({
        title: "处理结束",
        description: "OCR 流程已完成"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mistral OCR 文字识别</h1>
          <p className="text-blue-200 text-lg">上传图片或PDF文件，智能提取文字内容</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - API Key and File Upload */}
          <div className="space-y-6">
            <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
            <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
            
            {selectedFile && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon className="w-6 h-6 text-blue-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={processOCR} 
                    disabled={isLoading || !apiKey}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>正在识别...</span>
                      </div>
                    ) : (
                      '开始识别文字'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - OCR Results */}
          <div>
            <OcrResults result={ocrResult} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
