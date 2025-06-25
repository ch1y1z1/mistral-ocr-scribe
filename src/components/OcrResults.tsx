
import { useState } from 'react';
import { Copy, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface OcrResultsProps {
  result: string;
}

const OcrResults = ({ result }: OcrResultsProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
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
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "下载成功",
      description: "识别结果已保存为文本文件"
    });
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900">
          <FileText className="w-5 h-5 text-green-600" />
          <span>识别结果</span>
        </CardTitle>
        <CardDescription>
          {result ? "文字识别完成，您可以复制或下载结果" : "上传文件并点击识别按钮开始"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result ? (
          <>
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </Button>
              <Button
                onClick={downloadText}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>下载</span>
              </Button>
            </div>
            <Textarea
              value={result}
              readOnly
              className="min-h-[400px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              placeholder="识别结果将显示在这里..."
            />
          </>
        ) : (
          <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">等待识别结果</p>
              <p className="text-sm text-gray-500">
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
