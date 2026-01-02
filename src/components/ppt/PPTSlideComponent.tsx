import React from 'react';
import { API_BASE_URL } from '../../services/api';

interface Slide {
  slideNumber: number;
  type: 'cover' | 'content' | 'summary';
  title: string;
  content: string;
  imageFilename?: string;
}

interface PPTSlideComponentProps {
  slide: Slide;
  theme: string;
}

const PPTSlideComponent: React.FC<PPTSlideComponentProps> = ({ slide, theme }) => {
  // 添加空值检查
  if (!slide) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '16/9',
        background: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  const themeStyles = {
    business: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    creative: {
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
      color: 'white'
    },
    minimal: {
      background: 'white',
      color: '#333',
      border: '2px solid #eee'
    }
  };

  const currentTheme = themeStyles[theme as keyof typeof themeStyles] || themeStyles.business;

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '16/9',
      ...currentTheme,
      borderRadius: '8px',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* 幻灯片标题 */}
      <h1 style={{
        fontSize: '36px',
        fontWeight: 'bold',
        margin: '0 0 30px 0',
        textAlign: 'center',
        lineHeight: '1.2'
      }}>
        {slide.title || '无标题'}
      </h1>

      {/* 内容区域 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        flex: 1
      }}>
        {/* 图片 */}
        {slide.imageFilename && (
          <div style={{ flex: '0 0 45%', textAlign: 'center' }}>
            <img
              src={`${API_BASE_URL}/uploads/images/${slide.imageFilename}`}
              alt={slide.title || '幻灯片图片'}
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        )}

        {/* 文本内容 */}
        <div style={{
          flex: 1,
          fontSize: '20px',
          lineHeight: '1.6'
        }}>
          {(slide.content || '').split('\n').map((line, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              {line.startsWith('•') || line.startsWith('-') ? (
                <div style={{ paddingLeft: '20px' }}>• {line.substring(1).trim()}</div>
              ) : (
                <div>{line}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 页码 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '30px',
        fontSize: '14px',
        opacity: 0.7
      }}>
        {slide.slideNumber || 1}
      </div>
    </div>
  );
};

export default PPTSlideComponent;
