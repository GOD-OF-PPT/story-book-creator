import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pptApi, type PPT } from '../services/api';
import PPTSlideComponent from '../components/ppt/PPTSlideComponent';

type ViewMode = 'slide' | 'waterfall';

const PPTPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ppt, setPPT] = useState<PPT | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('slide');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPPT();
  }, [id]);

  const loadPPT = async () => {
    if (!id) return;
    try {
      const response = await pptApi.findOne(id);
      setPPT(response.data);
    } catch (error) {
      console.error('加载 PPT 失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (ppt && currentSlide < ppt.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const downloadPDF = async () => {
    if (!id) return;
    try {
      const url = pptApi.downloadPdf(id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ppt?.title || 'ppt'}.pdf`;
      a.click();
    } catch (error) {
      console.error('PDF 下载失败:', error);
    }
  };

  const downloadHTML = async () => {
    if (!id) return;
    try {
      const url = pptApi.downloadHtml(id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ppt?.title || 'ppt'}.html`;
      a.click();
    } catch (error) {
      console.error('HTML 下载失败:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  if (!ppt) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>PPT 不存在</div>;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← 返回
          </button>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{ppt.title}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 视图模式切换 */}
          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
            <button
              onClick={() => setViewMode('slide')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: viewMode === 'slide' ? '#007bff' : 'white',
                color: viewMode === 'slide' ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              📊 幻灯片
            </button>
            <button
              onClick={() => setViewMode('waterfall')}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: viewMode === 'waterfall' ? '#007bff' : 'white',
                color: viewMode === 'waterfall' ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              🌊 瀑布流
            </button>
          </div>

          <button
            onClick={downloadPDF}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            📥 下载 PDF
          </button>

          {/* HTML下载按钮 */}
          <button
            onClick={downloadHTML}
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🌐 下载 HTML
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* 检查是否为HTML模式 */}
        {ppt.sourceContent && ppt.slides.length === 0 ? (
          <HTMLPPTView ppt={ppt} />
        ) : ppt.slides.length === 0 ? (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '18px',
            color: '#666'
          }}>
            PPT 生成中，请稍候...
          </div>
        ) : viewMode === 'slide' ? (
          <SlideView 
            ppt={ppt}
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            nextSlide={nextSlide}
            prevSlide={prevSlide}
          />
        ) : (
          <WaterfallView ppt={ppt} />
        )}
      </div>
    </div>
  );
};

// 幻灯片视图组件
const SlideView: React.FC<{
  ppt: PPT;
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}> = ({ ppt, currentSlide, setCurrentSlide, nextSlide, prevSlide }) => {
  const slide = ppt.slides[currentSlide];

  // 添加空值检查
  if (!slide) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '18px',
        color: '#666'
      }}>
        幻灯片加载中...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* 主幻灯片区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#f8f9fa',
          padding: '20px'
        }}>
          <PPTSlideComponent slide={slide} theme={ppt.theme} />
        </div>

        {/* 控制栏 */}
        <div style={{
          padding: '15px',
          background: 'white',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px'
        }}>
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            style={{
              padding: '10px 20px',
              background: currentSlide === 0 ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ◀ 上一页
          </button>

          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {currentSlide + 1} / {ppt.slides.length}
          </span>

          <button
            onClick={nextSlide}
            disabled={currentSlide === ppt.slides.length - 1}
            style={{
              padding: '10px 20px',
              background: currentSlide === ppt.slides.length - 1 ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentSlide === ppt.slides.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            下一页 ▶
          </button>
        </div>
      </div>

      {/* 缩略图侧栏 */}
      <div style={{
        width: '250px',
        background: 'white',
        borderLeft: '1px solid #eee',
        overflowY: 'auto',
        padding: '10px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
          幻灯片缩略图
        </h4>
        {ppt.slides.map((slide, index) => (
          <div
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              padding: '10px',
              margin: '5px 0',
              border: index === currentSlide ? '2px solid #007bff' : '1px solid #eee',
              borderRadius: '4px',
              cursor: 'pointer',
              background: index === currentSlide ? '#f0f8ff' : 'white'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              {index + 1}. {slide?.title || '无标题'}
            </div>
            <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
              {(slide?.content || '').substring(0, 60)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 瀑布流视图组件
const WaterfallView: React.FC<{ ppt: PPT }> = ({ ppt }) => {
  return (
    <div style={{
      padding: '20px',
      overflowY: 'auto',
      background: '#f8f9fa'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}>
        {ppt.slides.map((slide, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <PPTSlideComponent slide={slide} theme={ppt.theme} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PPTPreview;

// HTML PPT 预览组件
const HTMLPPTView: React.FC<{ ppt: PPT }> = ({ ppt }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {showPreview ? (
        // HTML内容预览
        <div style={{ flex: 1, position: 'relative' }}>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕ 关闭预览
          </button>
          <iframe
            srcDoc={ppt.sourceContent}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="PPT预览"
          />
        </div>
      ) : (
        // 下载和预览选项
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          padding: '40px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌐</div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
              HTML PPT 已生成完成
            </h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
              您的PPT已使用多模态AI模型生成为完整的HTML格式，包含交互功能和精美样式。
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => setShowPreview(true)}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                👁️ 在线预览
              </button>
              
              <button
                onClick={() => {
                  const url = pptApi.downloadHtml(ppt._id);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${ppt.title || 'ppt'}.html`;
                  a.click();
                }}
                style={{
                  padding: '12px 24px',
                  background: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🌐 下载 HTML
              </button>
              
              <button
                onClick={() => {
                  const url = pptApi.downloadPdf(ppt._id);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${ppt.title || 'ppt'}.pdf`;
                  a.click();
                }}
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📥 下载 PDF
              </button>
            </div>
            
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: '#e3f2fd', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1976d2'
            }}>
              💡 提示：HTML文件包含完整的PPT交互功能，支持键盘导航和点击切换
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
