import { marked } from 'marked';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface ExtractedImage {
  id: string;
  base64: string;
  fileName: string;
  isHostedUrl?: boolean;
}

interface MarkdownPreviewProps {
  content: string;
  images?: ExtractedImage[];
  className?: string;
}

// 处理数学公式的函数
const processMathFormulas = (content: string): string => {
  // 先处理块级数学公式 $$...$$（包括跨行）
  content = content.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (match, formula) => {
    try {
      // 清理公式中的多余空白
      const cleanFormula = formula.trim();
      if (!cleanFormula) {
        return match; // 如果公式为空，保持原样
      }
      
      // NOTE: The following line injects HTML rendered by KaTeX.
      // KaTeX's current configuration (`trust: false`) and its default behavior are relied upon to prevent XSS.
      // If KaTeX settings or version are changed, review this code for XSS safety.
      const rendered = katex.renderToString(cleanFormula, {
        displayMode: true,
        throwOnError: false,
        trust: false
      });
      return `<div class="math-display">${rendered}</div>`;
    } catch (error) {
      console.warn('块级公式渲染失败:', formula, error);
      return match; // 如果渲染失败，保持原样
    }
  });

  // 再处理行内数学公式 $...$（避免跨行匹配）
  content = content.replace(/\$([^$\n\r]+)\$/g, (match, formula) => {
    try {
      const cleanFormula = formula.trim();
      if (!cleanFormula) {
        return match; // 如果公式为空，保持原样
      }
      
      // NOTE: The following line injects HTML rendered by KaTeX.
      // KaTeX's current configuration (`trust: false`) and its default behavior are relied upon to prevent XSS.
      // If KaTeX settings or version are changed, review this code for XSS safety.
      const rendered = katex.renderToString(cleanFormula, {
        displayMode: false,
        throwOnError: false,
        trust: false
      });
      return rendered;
    } catch (error) {
      console.warn('行内公式渲染失败:', formula, error);
      return match; // 如果渲染失败，保持原样
    }
  });

  return content;
};

const MarkdownPreview = ({ content, images = [], className = '' }: MarkdownPreviewProps) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  // 创建图片ID到地址的映射
  const imageMap = useMemo(() => {
    const map = new Map<string, string>();
    images.forEach(image => {
      if (image.base64) {
        let imageUrl = '';
        
        if (image.isHostedUrl) {
          // 直接使用 Mistral 托管的地址
          imageUrl = image.base64;
        } else {
          // 处理 base64 数据
          if (image.base64.startsWith('data:')) {
            imageUrl = image.base64; // 已经是完整的 data URL
          } else {
            // 需要创建 blob URL
            let cleanBase64 = image.base64;
            if (cleanBase64.includes(',')) {
              cleanBase64 = cleanBase64.split(',')[1];
            }
            
            try {
              const byteCharacters = atob(cleanBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/png' });
              imageUrl = URL.createObjectURL(blob);
            } catch (error) {
              console.error('创建图片blob URL失败:', error);
              return; // 跳过这个图片
            }
          }
        }
        
        if (imageUrl) {
          // 使用文件名作为key
          map.set(image.fileName, imageUrl);
          // 也支持ID作为key
          map.set(image.id, imageUrl);
          // 支持不带扩展名的文件名
          const nameWithoutExt = image.fileName.replace(/\.(png|jpg|jpeg|gif|bmp|webp)$/i, '');
          map.set(nameWithoutExt, imageUrl);
          // 支持images/前缀的引用
          map.set(`images/${image.fileName}`, imageUrl);
        }
      }
    });
    return map;
  }, [images]);

  useEffect(() => {
    const processMarkdown = async () => {
      try {
        // 配置 marked 选项
        marked.setOptions({
          gfm: true,
          breaks: true,
          headerIds: false,
          mangle: false
        });

        // 先处理数学公式，再处理图片引用
        let processedContent = processMathFormulas(content);
        
        console.log('开始处理图片引用，可用映射:', Array.from(imageMap.keys()));
        
        // 匹配各种图片引用格式
        // ![alt](filename) 或 ![alt](image_id) 或 ![alt](images/filename)
        processedContent = processedContent.replace(
          /!\[(.*?)\]\(([^)]+)\)/g,
          (match, alt, src) => {
            console.log('处理图片引用:', { alt, src });
            
            // 尝试多种匹配方式
            let imageUrl = null;
            
            // 1. 直接匹配
            imageUrl = imageMap.get(src);
            if (imageUrl) {
              console.log('直接匹配成功:', src, '->', imageUrl.substring(0, 50));
              return `![${alt}](${imageUrl})`;
            }
            
            // 2. 去掉 images/ 前缀匹配
            const srcWithoutPrefix = src.replace(/^images\//, '');
            imageUrl = imageMap.get(srcWithoutPrefix);
            if (imageUrl) {
              console.log('去前缀匹配成功:', srcWithoutPrefix, '->', imageUrl.substring(0, 50));
              return `![${alt}](${imageUrl})`;
            }
            
            // 3. 模糊匹配：查找包含src的任何键
            for (const [key, value] of imageMap.entries()) {
              if (key.includes(srcWithoutPrefix) || srcWithoutPrefix.includes(key.replace(/\.(png|jpg|jpeg|gif|bmp|webp)$/i, ''))) {
                console.log('模糊匹配成功:', key, '->', value.substring(0, 50));
                return `![${alt}](${value})`;
              }
            }
            
            console.log('图片引用无法找到匹配:', src, '可用键:', Array.from(imageMap.keys()));
            return match; // 如果找不到图片，保持原样
          }
        );

        // 渲染 markdown
        const html = await marked.parse(processedContent);
        setRenderedHtml(html);
      } catch (error) {
        console.error('Markdown 渲染失败:', error);
        setRenderedHtml('<p>Markdown 渲染失败</p>');
      }
    };

    if (content) {
      processMarkdown();
    } else {
      setRenderedHtml('');
    }

    // 清理 blob URLs (不清理托管地址)
    return () => {
      images.forEach(image => {
        if (!image.isHostedUrl && image.base64 && !image.base64.startsWith('data:')) {
          // 只清理我们自己创建的 blob URLs
          const url = imageMap.get(image.fileName) || imageMap.get(image.id);
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        }
      });
    };
  }, [content, imageMap, images]);

  if (!content) {
    return (
      <Card className={`bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl h-full ${className}`}>
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100/50">
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span>Markdown 预览</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px] md:min-h-[400px] flex items-center justify-center">
          <div className="text-center px-4">
            <Eye className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-base md:text-lg font-medium text-gray-600 mb-2">等待内容</p>
            <p className="text-xs md:text-sm text-gray-500">
              Markdown 预览将显示在这里
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl h-full ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100/50">
        <CardTitle className="flex items-center space-x-2 text-gray-900">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span>Markdown 预览</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 max-h-[500px] overflow-y-auto">
        <div 
          className="prose prose-sm max-w-none 
            prose-headings:text-gray-900 prose-headings:font-bold
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-1 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mb-2
            prose-h4:text-base prose-h4:mb-2
            prose-h5:text-sm prose-h5:mb-1
            prose-h6:text-sm prose-h6:mb-1
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-blue-600 prose-a:underline prose-a:decoration-blue-300 hover:prose-a:decoration-blue-500
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-em:text-gray-700 prose-em:italic
            prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
            prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50/30 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic
            prose-ul:my-4 prose-ul:pl-6 prose-li:my-1 prose-li:marker:text-blue-500
            prose-ol:my-4 prose-ol:pl-6 prose-ol:marker:text-blue-500 prose-ol:marker:font-semibold
            prose-table:text-sm prose-table:border-collapse prose-table:w-full
            prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
            prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-2
            prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full prose-img:h-auto
            prose-hr:border-gray-300 prose-hr:my-6
            [&_.katex]:text-gray-900 [&_.katex-display]:my-4 [&_.katex-display]:text-center
            [&_.math-display]:my-4 [&_.math-display]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </CardContent>
    </Card>
  );
};

export default MarkdownPreview;