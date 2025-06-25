

import { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, Copy, Settings, Eye, EyeOff, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import UrlInput from '@/components/UrlInput';
import ApiKeyManager from '@/components/ApiKeyManager';
import OcrResults from '@/components/OcrResults';

const Index = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mistral-api-key') || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
  const [ocrResult, setOcrResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setOcrResult('');
    setInputType('file');
    
    if (file) {
      toast({
        title: "文件选择成功",
        description: `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  const handleUrlInput = (url: string) => {
    setInputUrl(url);
    setSelectedFile(null);
    setOcrResult('');
    setInputType('url');
    
    if (url) {
      toast({
        title: "URL 输入成功",
        description: `已输入: ${url}`
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

    return `mistral://files/${uploadResult.id}`;
  };

  const processOCR = async () => {
    if ((!selectedFile && !inputUrl) || !apiKey) {
      toast({
        title: "错误",
        description: "请选择文件或输入URL，并输入API密钥",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    toast({
      title: "开始 OCR 处理",
      description: inputType === 'file' ? "正在准备文件..." : "正在处理URL..."
    });

    try {
      let documentSource: any = null;

      if (inputType === 'url' && inputUrl) {
        // URL 处理
        console.log('处理 URL:', inputUrl);
        
        // 检查是否是图片 URL
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const isImageUrl = imageExtensions.some(ext => 
          inputUrl.toLowerCase().includes(ext) || 
          inputUrl.toLowerCase().match(new RegExp(`\\${ext}(\\?|$)`))
        );
        
        if (isImageUrl) {
          documentSource = {
            type: "image_url",
            image_url: inputUrl
          };
          console.log('识别为图片 URL:', documentSource);
        } else {
          // 假设是 PDF 或其他文档 URL
          documentSource = {
            type: "document_url",
            document_url: inputUrl
          };
          console.log('识别为文档 URL:', documentSource);
        }
      } else if (inputType === 'file' && selectedFile) {
        // 文件处理 - 保持原有逻辑
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
      }

      console.log('准备发送 OCR API 请求...');
      console.log('输入类型:', inputType);
      if (inputType === 'file') {
        console.log('文件类型:', selectedFile?.type);
        console.log('文件大小:', selectedFile?.size, 'bytes');
      } else {
        console.log('URL:', inputUrl);
      }

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
      
      console.log('OCR 完整响应数据:', JSON.stringify(data, null, 2));
      console.log('响应解析耗时:', parseTime, 'ms');
      
      let extractedText = '';
      
      // 更详细的数据结构检查和提取
      if (data && typeof data === 'object') {
        console.log('数据结构分析:');
        console.log('- data.pages 是否存在:', !!data.pages);
        console.log('- data.pages 类型:', typeof data.pages);
        console.log('- data.pages 是否为数组:', Array.isArray(data.pages));
        
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
          console.log('页面数量:', data.pages.length);
          
          data.pages.forEach((page: any, index: number) => {
            console.log(`页面 ${index + 1}:`, page);
            console.log(`- markdown 字段存在:`, !!page.markdown);
            console.log(`- markdown 内容:`, page.markdown);
            console.log(`- text 字段存在:`, !!page.text);
            console.log(`- text 内容:`, page.text);
          });
          
          // 尝试多种提取方式
          const markdownTexts = data.pages
            .map((page: any) => page.markdown || page.text || '')
            .filter((text: string) => text.trim().length > 0);
          
          if (markdownTexts.length > 0) {
            extractedText = markdownTexts.join('\n\n').trim();
            console.log('成功提取 markdown 文本，长度:', extractedText.length);
          } else {
            // 如果没有 markdown 或 text，尝试其他字段
            const allTexts = data.pages
              .map((page: any) => {
                const possibleFields = ['content', 'extracted_text', 'result'];
                for (const field of possibleFields) {
                  if (page[field] && typeof page[field] === 'string') {
                    return page[field];
                  }
                }
                return '';
              })
              .filter((text: string) => text.trim().length > 0);
            
            if (allTexts.length > 0) {
              extractedText = allTexts.join('\n\n').trim();
              console.log('从其他字段提取文本，长度:', extractedText.length);
            }
          }
        } else {
          // 如果没有 pages 结构，检查其他可能的结构
          console.log('没有 pages 结构，检查其他字段...');
          const possibleTopLevelFields = ['text', 'content', 'result', 'extracted_text', 'markdown'];
          
          for (const field of possibleTopLevelFields) {
            if (data[field] && typeof data[field] === 'string') {
              extractedText = data[field].trim();
              console.log(`从顶级字段 ${field} 提取文本，长度:`, extractedText.length);
              break;
            }
          }
        }
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn('未能提取到任何文字内容');
        extractedText = '未能提取到文字内容，请检查文件格式或重试';
        
        toast({
          title: "警告",
          description: "没有识别到任何文字内容",
          variant: "destructive"
        });
      } else {
        console.log('最终提取的文字:', extractedText.substring(0, 200) + '...');
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
          <p className="text-blue-200 text-lg">上传图片/PDF文件或输入URL，智能提取文字内容</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - API Key and Input Options */}
          <div className="space-y-6">
            <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
            
            {/* Input Type Selector */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-800">选择输入方式</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-4">
                  <Button
                    variant={inputType === 'file' ? 'default' : 'outline'}
                    onClick={() => setInputType('file')}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传文件
                  </Button>
                  <Button
                    variant={inputType === 'url' ? 'default' : 'outline'}
                    onClick={() => setInputType('url')}
                    className="flex-1"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    输入URL
                  </Button>
                </div>
                
                {inputType === 'file' ? (
                  <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
                ) : (
                  <UrlInput onUrlInput={handleUrlInput} inputUrl={inputUrl} />
                )}
              </CardContent>
            </Card>
            
            {(selectedFile || inputUrl) && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {inputType === 'file' ? (
                        <>
                          {selectedFile?.type.startsWith('image/') ? (
                            <ImageIcon className="w-6 h-6 text-blue-600" />
                          ) : (
                            <FileText className="w-6 h-6 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                            <p className="text-sm text-gray-500">
                              {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Link className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">URL 输入</p>
                            <p className="text-sm text-gray-500 break-all">{inputUrl}</p>
                          </div>
                        </>
                      )}
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
