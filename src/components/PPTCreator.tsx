import React, { useState } from 'react';
import { pptApi } from '../services/api';

type InputType = 'text' | 'document' | 'url';
type PPTTheme = 'business' | 'creative' | 'minimal';

const PPTCreator: React.FC = () => {
  const [inputType, setInputType] = useState<InputType>('text');
  const [textContent, setTextContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<PPTTheme>('business');
  const [useHTML, setUseHTML] = useState(true); // 默认使用HTML模式
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let result;
      
      switch (inputType) {
        case 'text':
          const textResponse = await pptApi.createFromText(textContent, theme, undefined, useHTML);
          result = textResponse.data;
          break;
        case 'url':
          const urlResponse = await pptApi.createFromUrl(url, theme, useHTML);
          result = urlResponse.data;
          break;
        case 'document':
          if (!file) return;
          const docResponse = await pptApi.createFromDocument(file, theme, useHTML);
          result = docResponse.data;
          break;
      }

      if (result && result._id) {
        window.location.href = `/ppt/preview/${result._id}`;
      }
    } catch (error) {
      console.error('PPT 生成失败:', error);
      alert('PPT 生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = () => {
    switch (inputType) {
      case 'text':
        return textContent.trim().length > 0;
      case 'url':
        return url.trim().length > 0;
      case 'document':
        return file !== null;
      default:
        return false;
    }
  };

  return (
    <div>
      {/* 输入方式选择 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>📝 选择输入方式</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          {[
            { value: 'text', label: '文本输入', icon: '📝' },
            { value: 'document', label: '文档上传', icon: '📄' },
            { value: 'url', label: '网址抓取', icon: '🌐' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setInputType(option.value as InputType)}
              style={{
                padding: '10px 15px',
                border: inputType === option.value ? '2px solid #007bff' : '1px solid #ddd',
                background: inputType === option.value ? '#f0f8ff' : 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>

        {/* 输入区域 */}
        {inputType === 'text' && (
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="请输入要转换为 PPT 的内容..."
            style={{
              width: '100%',
              height: '200px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        )}

        {inputType === 'url' && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="请输入网址 (如: https://example.com/article)"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        )}

        {inputType === 'document' && (
          <div>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ marginBottom: '10px' }}
            />
            <p style={{ fontSize: '12px', color: '#666' }}>
              支持格式: PDF, DOCX, TXT
            </p>
          </div>
        )}
      </div>

      {/* PPT 生成模式 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>🎯 生成模式</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => setUseHTML(true)}
            style={{
              flex: 1,
              padding: '12px',
              border: useHTML ? '2px solid #007bff' : '1px solid #ddd',
              background: useHTML ? '#f0f8ff' : 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>🚀 HTML模式 (推荐)</div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>一次生成完整HTML PPT，包含样式和交互</div>
          </button>
          <button
            onClick={() => setUseHTML(false)}
            style={{
              flex: 1,
              padding: '12px',
              border: !useHTML ? '2px solid #007bff' : '1px solid #ddd',
              background: !useHTML ? '#f0f8ff' : 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>📊 传统模式</div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>拆分幻灯片并生成配图</div>
          </button>
        </div>
      </div>

      {/* PPT 设置 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>⚙️ PPT 设置</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>主题风格:</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as PPTTheme)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="business">🏢 商务风格</option>
            <option value="creative">🎨 创意风格</option>
            <option value="minimal">📋 简约风格</option>
          </select>
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !canGenerate()}
        style={{
          width: '100%',
          padding: '15px',
          background: isGenerating || !canGenerate() ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: isGenerating || !canGenerate() ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? '🔄 生成中...' : '🚀 生成 PPT'}
      </button>
    </div>
  );
};

export default PPTCreator;
