import type React from 'react';
import { useState, useCallback, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

interface ProcessedImage {
  original: string;
  processed: string;
  filename: string;
}

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 测试样本图片
  const sampleImages = [
    {
      url: 'https://ugc.same-assets.com/OTshhTxyo3h08kkKwkcfgkfI49AwJiYU.jpeg',
      name: 'sample-portrait-1.jpg'
    },
    {
      url: 'https://ugc.same-assets.com/do4oamYjSeZV6RjAnhlprWGZEntF3cTB.jpeg',
      name: 'sample-portrait-2.jpg'
    },
    {
      url: 'https://ugc.same-assets.com/EAaFTepZgfyGkWXOiJJaBMW3hPVySIrc.jpeg',
      name: 'sample-portrait-3.jpg'
    }
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processImage(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  }, []);

  const handleSampleImageClick = async (imageUrl: string, filename: string) => {
    setError(null);
    setIsProcessing(true);
    setProcessedImage(null);

    try {
      // 获取图片作为blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // 从blob创建File对象
      const file = new File([blob], filename, { type: blob.type });

      // 处理图片
      await processImage(file);
    } catch (err) {
      console.error('加载样本图片出错:', err);
      setError('加载样本图片失败，请尝试上传您自己的图片。');
      setIsProcessing(false);
    }
  };

  const processImage = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择有效的图片文件（PNG、JPG等）');
      return;
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小必须小于10MB');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProcessedImage(null);

    try {
      // 创建原始图片URL
      const originalUrl = URL.createObjectURL(file);

      // 处理图片
      const blob = await removeBackground(file);
      const processedUrl = URL.createObjectURL(blob);

      setProcessedImage({
        original: originalUrl,
        processed: processedUrl,
        filename: file.name
      });
    } catch (err) {
      console.error('处理图片出错:', err);
      setError('背景移除失败，请尝试其他图片。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage.processed;
    link.download = `已移除背景-${processedImage.filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setProcessedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 头部 */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI - removeBackground
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            初次使用需要链接AI大模型，耗时约3~5分钟，请耐心等候。
            <br />
            后续再次使用，即可在几秒钟内完成抠图
          </p>
        </header>

        {/* 主体卡片区 */}
        <main className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* 上传与样本区 */}
          {!processedImage && !isProcessing && (
            <div className="p-8">
              {/* 上传区域 */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 mb-12 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">上传图片</h3>
                <p className="text-gray-600 mb-8">将图片拖拽到此处，或点击选择文件</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-200"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  选择图片
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-6">支持 PNG、JPG、JPEG、WEBP 格式（最大10MB）</p>
              </div>

              {/* 样本图片 */}
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  或使用示例图片测试
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                  {sampleImages.map((sample, index) => (
                    <button
                      key={sample.url}
                      onClick={() => handleSampleImageClick(sample.url, sample.name)}
                      className="relative group overflow-hidden rounded-2xl hover:shadow-md transition-all duration-200 bg-white p-0"
                    >
                      <img
                        src={sample.url}
                        alt={`样本 ${index + 1}`}
                        className="w-full h-28 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center rounded-2xl">
                        <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">
                          点击试试
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 text-center">点击任意图片测试背景移除功能</p>
              </div>

              {error && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-center">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* 处理中状态 */}
          {isProcessing && (
            <div className="p-16 text-center">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">正在移除背景...</h3>
              <p className="text-gray-600">处理时间取决于图片大小，请稍候</p>
            </div>
          )}

          {/* 结果展示 */}
          {processedImage && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800">处理完成！</h3>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  重新开始
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* 原图 */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">原图</h4>
                  <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                    <img
                      src={processedImage.original}
                      alt="原图"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                </div>

                {/* 处理后图片 */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">已移除背景</h4>
                  <div className="bg-transparent rounded-lg overflow-hidden border border-gray-300 relative">
                    {/* 透明背景棋盘格 */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='10' height='10'/%3E%3Crect x='10' y='10' width='10' height='10'/%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    />
                    <img
                      src={processedImage.processed}
                      alt="已移除背景"
                      className="w-full max-h-96 object-contain relative z-10"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors duration-200"
                >
                  <Download className="w-5 h-5 mr-2" />
                  下载图片
                </button>
              </div>
            </div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="text-center text-gray-500 text-sm mt-8">
          <p>🔒 所有处理都在您的浏览器本地完成，不会上传到网络上，请放心使用。</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
