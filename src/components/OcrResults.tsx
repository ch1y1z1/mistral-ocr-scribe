import { Copy, FileText, Download, Image as ImageIcon, Archive, Eye, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import MarkdownPreview from '@/components/MarkdownPreview';

interface ExtractedImage {
  id: string;
  base64: string;
  fileName: string;
  isHostedUrl?: boolean;
}

interface OcrResultsProps {
  result: string;
  images?: ExtractedImage[];
  onResultChange?: (newResult: string) => void;
}

const OcrResults = ({ result, images = [], onResultChange }: OcrResultsProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(result);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当result改变时同步更新editableText
  useEffect(() => {
    setEditableText(result);
  }, [result]);

  const handleEditToggle = () => {
    if (isEditing) {
      // 保存编辑
      if (onResultChange && editableText !== result) {
        onResultChange(editableText);
        toast({
          title: "保存成功",
          description: "文本修改已保存"
        });
      }
      // 退出编辑模式时失去焦点
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setEditableText(result); // 恢复原始内容
    setIsEditing(false);
    // 取消编辑时失去焦点
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
    toast({
      title: "取消编辑",
      description: "已恢复原始内容"
    });
  };

  // 获取当前显示的文本（编辑模式下使用editableText，否则使用result）
  const currentText = isEditing ? editableText : result;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      toast({
        title: "复制成功",
        description: "识别结果已复制到剪贴板"
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };

  const downloadText = () => {
    const blob = new Blob([currentText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "下载成功",
      description: "识别结果已保存为 Markdown 文件"
    });
  };

  const downloadZip = async () => {
    try {
      const zip = new JSZip();
      
      // 添加文字文件（Markdown 格式）
      zip.file('ocr-result.md', currentText);
      
      // 添加图片文件
      if (images.length > 0) {
        const imagesFolder = zip.folder('images');
        
        // 处理每个图片
        for (const image of images) {
          if (imagesFolder) {
            if (image.isHostedUrl) {
              // 对于托管地址，需要先下载图片内容
              try {
                const response = await fetch(image.base64);
                const blob = await response.blob();
                imagesFolder.file(image.fileName, blob);
              } catch (error) {
                console.error(`下载托管图片失败: ${image.fileName}`, error);
                // 如果下载失败，跳过这个图片
                continue;
              }
            } else {
              // 清理 base64 数据，确保没有 data URL 前缀
              let cleanBase64 = image.base64;
              if (cleanBase64.startsWith('data:')) {
                const base64Data = cleanBase64.split(',')[1];
                if (base64Data) {
                  cleanBase64 = base64Data;
                }
              }
              imagesFolder.file(image.fileName, cleanBase64, { base64: true });
            }
          }
        }
      }
      
      // 生成压缩包
      const content = await zip.generateAsync({ type: 'blob' });
      
      // 下载压缩包
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ocr-complete-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "压缩包下载成功",
        description: `包含文字和 ${images.length} 张图片的完整压缩包已下载`
      });
    } catch (error) {
      console.error('生成压缩包失败:', error);
      toast({
        title: "下载失败",
        description: "生成压缩包时发生错误",
        variant: "destructive"
      });
    }
  };

  const downloadImage = (image: ExtractedImage) => {
    try {
      if (image.isHostedUrl) {
        // 对于托管地址，直接创建下载链接
        const a = document.createElement('a');
        a.href = image.base64;
        a.download = image.fileName;
        a.target = '_blank'; // 在新标签页打开，以防同源策略问题
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // 对于 base64 数据，转换为 blob 下载
        let cleanBase64 = image.base64;
        
        // 处理 data URL
        if (cleanBase64.startsWith('data:')) {
          const base64Data = cleanBase64.split(',')[1];
          if (base64Data) {
            cleanBase64 = base64Data;
          }
        }
        
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "图片下载成功",
        description: `图片 ${image.fileName} 已下载`
      });
    } catch (error) {
      console.error('下载图片失败:', error);
      toast({
        title: "下载失败",
        description: "下载图片时发生错误",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/98 h-full">
      <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-gray-100/50">
        <CardTitle className="flex items-center space-x-2 text-gray-900">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span>识别结果</span>
        </CardTitle>
        <CardDescription>
          {result ? 
            `文字识别完成${images.length > 0 ? `，提取了 ${images.length} 张图片` : ''}` : 
            "上传文件并点击识别按钮开始"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 text-xs md:text-sm hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 hover:shadow-md"
              >
                <Copy className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">复制文字</span>
                <span className="sm:hidden">复制</span>
              </Button>
              <Button
                onClick={downloadText}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 text-xs md:text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 hover:shadow-md"
              >
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">下载 Markdown</span>
                <span className="sm:hidden">MD</span>
              </Button>
              {images.length > 0 && (
                <Button
                  onClick={downloadZip}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 hover:border-purple-300 text-blue-700 hover:text-purple-700 text-xs md:text-sm transition-all duration-200 hover:shadow-md"
                >
                  <Archive className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">完整压缩包</span>
                  <span className="sm:hidden">ZIP</span>
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm">
                  <FileText className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">原始文本</span>
                  <span className="sm:hidden">文本</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm">
                  <Eye className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">预览</span>
                  <span className="sm:hidden">预览</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm">
                  <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">图片 ({images.length})</span>
                  <span className="sm:hidden">图片 ({images.length})</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-4">
                <div className="relative">
                  {/* 编辑按钮区域 */}
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleEditToggle}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 border-green-300 text-green-700 hover:text-green-800"
                        >
                          <Save className="w-3 h-3" />
                          <span className="hidden sm:inline">保存</span>
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-800"
                        >
                          <X className="w-3 h-3" />
                          <span className="hidden sm:inline">取消</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditToggle}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 hover:text-blue-800"
                        disabled={!result || !result.trim()}
                      >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">编辑</span>
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    ref={textareaRef}
                    value={isEditing ? editableText : result}
                    onChange={(e) => isEditing && setEditableText(e.target.value)}
                    readOnly={!isEditing}
                    className={`min-h-[400px] md:min-h-[500px] w-full resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm font-mono pr-20 ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    }`}
                    placeholder="识别结果将显示在这里..."
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <MarkdownPreview 
                  content={currentText} 
                  images={images}
                  className="min-h-[400px]"
                />
              </TabsContent>
              
              <TabsContent value="images" className="mt-4">
                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                    {images.map((image, index) => (
                      <Card key={image.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-2 md:p-3">
                          <div className="relative group">
                            <img
                              src={image.isHostedUrl ? image.base64 : (image.base64.startsWith('data:') ? image.base64 : `data:image/png;base64,${image.base64}`)}
                              alt={`提取的图片 ${index + 1}`}
                              className="w-full h-24 md:h-32 object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                console.error('图片加载失败:', image.fileName, image.base64.substring(0, 50));
                                e.currentTarget.style.display = 'none';
                              }}
                              onClick={() => {
                                // 点击放大显示图片
                                const newWindow = window.open();
                                if (newWindow) {
                                  const imgSrc = image.isHostedUrl ? image.base64 : (image.base64.startsWith('data:') ? image.base64 : `data:image/png;base64,${image.base64}`);
                                  newWindow.document.write(`<img src="${imgSrc}" style="max-width:100%;height:auto;" />`);
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                              {image.fileName}
                            </span>
                            <Button
                              onClick={() => downloadImage(image)}
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6 hover:bg-blue-100"
                              title="下载图片"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs md:text-sm text-gray-500">没有提取到图片内容</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="min-h-[300px] md:min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center px-4">
              <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-base md:text-lg font-medium text-gray-600 mb-2">等待识别结果</p>
              <p className="text-xs md:text-sm text-gray-500">
                上传图片或PDF文件，然后点击识别按钮
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OcrResults;