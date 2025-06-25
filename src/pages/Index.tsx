

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
  const [extractedImages, setExtractedImages] = useState<Array<{id: string, base64: string, fileName: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setOcrResult('');
    setExtractedImages([]);
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
    setExtractedImages([]);
    setInputType('url');
    
    if (url) {
      toast({
        title: "URL 输入成功",
        description: `已输入: ${url}`
      });
    }
  };

  // Convert PDF file to base64 for direct processing
  const convertPdfToBase64 = async (file: File): Promise<string> => {
    console.log('开始转换 PDF 文件为 base64...');
    toast({
      title: "PDF 文件转换",
      description: "正在将 PDF 转换为 base64 格式..."
    });

    const startTime = Date.now();
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        
        const conversionTime = Date.now() - startTime;
        console.log(`PDF 转换耗时: ${conversionTime}ms`);
        
        toast({
          title: "PDF 转换完成",
          description: `Base64 转换耗时: ${conversionTime}ms`
        });
        
        resolve(base64);
      };
      reader.onerror = () => {
        console.error('PDF 文件读取失败');
        toast({
          title: "PDF 转换失败",
          description: "无法读取 PDF 文件",
          variant: "destructive"
        });
        reject(new Error('PDF 文件读取失败'));
      };
      reader.readAsDataURL(file);
    });
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
        // 文件处理 - 统一使用 base64 方式
        const startConversion = Date.now();
        
        if (selectedFile.type === 'application/pdf') {
          // PDF 文件处理 - 转换为 base64
          toast({
            title: "PDF 转换",
            description: "正在将 PDF 转换为 Base64 格式..."
          });

          const base64 = await convertPdfToBase64(selectedFile);
          
          documentSource = {
            type: "document_url",
            document_url: `data:application/pdf;base64,${base64}`
          };
          
          console.log('PDF 文档源（base64）:', documentSource.type);
        } else {
          // 图片文件处理
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
        model: 'mistral-ocr-latest',
        document: documentSource,
        include_image_base64: true
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
      let allImages: Array<{id: string, base64: string, fileName: string}> = [];
      
      // 根据官方文档结构提取文本和图片
      if (data && typeof data === 'object') {
        console.log('数据结构分析:');
        console.log('- data.pages 是否存在:', !!data.pages);
        console.log('- data.pages 类型:', typeof data.pages);
        console.log('- data.pages 是否为数组:', Array.isArray(data.pages));
        
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
          console.log('页面数量:', data.pages.length);
          
          // 根据官方文档，每个页面包含 markdown 字段和 images 字段
          const markdownContents: string[] = [];
          
          data.pages.forEach((page: any, index: number) => {
            console.log(`页面 ${index + 1}:`, Object.keys(page));
            
            // 提取文本内容
            if (page.markdown && typeof page.markdown === 'string') {
              markdownContents.push(page.markdown);
              console.log(`页面 ${index + 1} markdown 长度:`, page.markdown.length);
            } else if (page.text && typeof page.text === 'string') {
              markdownContents.push(page.text);
              console.log(`页面 ${index + 1} text 长度:`, page.text.length);
            } else {
              console.log(`页面 ${index + 1} 没有可用的文本内容`);
            }
            
            // 提取图片内容
            if (page.images && Array.isArray(page.images) && page.images.length > 0) {
              console.log(`页面 ${index + 1} 图片数量:`, page.images.length);
              
              page.images.forEach((image: any, imgIndex: number) => {
                if (image.image_base64 && typeof image.image_base64 === 'string') {
                  // 使用 image.id 如果存在，否则生成简单的文件名
                  let fileName;
                  if (image.id && typeof image.id === 'string') {
                    // 如果 id 已经包含扩展名，直接使用；否则根据图片类型添加扩展名
                    fileName = image.id.includes('.') ? image.id : `${image.id}.jpeg`;
                  } else {
                    // 生成简单的文件名，与 MD 中的引用保持一致
                    fileName = `img-${imgIndex}.jpeg`;
                  }
                  
                  // 检查图片数据格式并标准化
                  let imageBase64 = image.image_base64;
                  
                  // 如果图片数据不是完整的 data URL，添加前缀
                  if (!imageBase64.startsWith('data:')) {
                    imageBase64 = `data:image/png;base64,${imageBase64}`;
                  }
                  
                  allImages.push({
                    id: image.id || `img-${imgIndex}`,
                    base64: imageBase64,
                    fileName: fileName
                  });
                  
                  console.log(`页面 ${index + 1} 图片 ${imgIndex + 1}: ${fileName}`);
                }
              });
            } else {
              console.log(`页面 ${index + 1} 没有图片内容`);
            }
          });
          
          if (markdownContents.length > 0) {
            extractedText = markdownContents.join('\n\n').trim();
            
            // 修复 MD 文件中图片路径，添加 images/ 前缀
            extractedText = extractedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
              // 如果图片路径不以 images/ 开头且不是绝对路径，添加 images/ 前缀
              if (!src.startsWith('images/') && !src.startsWith('http') && !src.startsWith('/')) {
                return `![${alt}](images/${src})`;
              }
              return match;
            });
            
            console.log('成功提取文本内容，总长度:', extractedText.length);
          } else {
            console.log('所有页面都没有找到文本内容');
          }
        } else {
          // 如果没有 pages 结构，尝试直接查找文本字段
          console.log('没有 pages 结构，检查直接的文本字段...');
          const directTextFields = ['markdown', 'text', 'content', 'result'];
          
          for (const field of directTextFields) {
            if (data[field] && typeof data[field] === 'string') {
              extractedText = data[field].trim();
              
              // 修复 MD 文件中图片路径，添加 images/ 前缀
              extractedText = extractedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
                // 如果图片路径不以 images/ 开头且不是绝对路径，添加 images/ 前缀
                if (!src.startsWith('images/') && !src.startsWith('http') && !src.startsWith('/')) {
                  return `![${alt}](images/${src})`;
                }
                return match;
              });
              
              console.log(`从字段 ${field} 提取文本，长度:`, extractedText.length);
              break;
            }
          }
        }
      }
      
      console.log('提取的图片数量:', allImages.length);
      setExtractedImages(allImages);
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <div className="container mx-auto px-4 py-6 md:py-8 relative z-10">
        {/* 标题区域 */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Mistral OCR 文字识别
            </h1>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
        </div>

        <div className="grid xl:grid-cols-5 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Column - API Key and Input Options */}
          <div className="xl:col-span-2 lg:col-span-1 space-y-4">
            <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
            
            {/* 文件输入与识别卡片 */}
            <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/98">
              <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-gray-100/50">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  <span>文字识别</span>
                </CardTitle>
                <CardDescription>
                  选择输入方式，上传文件或输入URL开始识别
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 输入方式选择 */}
                <div className="flex space-x-2">
                  <Button
                    variant={inputType === 'file' ? 'default' : 'outline'}
                    onClick={() => setInputType('file')}
                    size="sm"
                    className={`flex-1 transition-all duration-200 ${
                      inputType === 'file' 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg' 
                        : 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传文件
                  </Button>
                  <Button
                    variant={inputType === 'url' ? 'default' : 'outline'}
                    onClick={() => setInputType('url')}
                    size="sm"
                    className={`flex-1 transition-all duration-200 ${
                      inputType === 'url' 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg' 
                        : 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    输入URL
                  </Button>
                </div>
                
                {/* 输入区域 */}
                <div className="border-2 border-dashed border-gradient-to-r from-purple-200 to-pink-200 bg-gradient-to-r from-purple-50/30 to-pink-50/30 rounded-xl p-4 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50/40">
                  {inputType === 'file' ? (
                    <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
                  ) : (
                    <UrlInput onUrlInput={handleUrlInput} inputUrl={inputUrl} />
                  )}
                </div>
                
                {/* 识别按钮 */}
                <Button 
                  onClick={processOCR} 
                  disabled={isLoading || !apiKey || (!selectedFile && !inputUrl)}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white/20"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>正在识别...</span>
                    </div>
                  ) : !apiKey ? (
                    '请先配置 API 密钥'
                  ) : (!selectedFile && !inputUrl) ? (
                    '请选择文件或输入 URL'
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>开始识别文字</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - OCR Results */}
          <div className="xl:col-span-3 lg:col-span-2">
            <OcrResults result={ocrResult} images={extractedImages} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
