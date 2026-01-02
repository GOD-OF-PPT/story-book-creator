import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExportModalProps {
  bookId?: string; // 可选参数，保持兼容性
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: { screenshots: boolean; pdf: boolean; textScript: boolean }) => void;
  isExporting: boolean;
}

export default function ExportModal({ isOpen, onClose, onExport, isExporting }: ExportModalProps) {
  const { t } = useTranslation();
  const [screenshots, setScreenshots] = useState(true);
  const [pdf, setPdf] = useState(false);
  const [textScript, setTextScript] = useState(true); // 默认选中文案导出

  if (!isOpen) return null;

  const handleExport = () => {
    if (!screenshots && !pdf && !textScript) {
      alert(t('error.selectExportFormat', '请至少选择一种导出格式'));
      return;
    }
    onExport({ screenshots, pdf, textScript });
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '24px', 
        minWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px' }}>
          📥 导出绘本
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ marginBottom: '16px', color: '#666' }}>请选择要导出的内容：</p>
          
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={textScript}
              onChange={(e) => setTextScript(e.target.checked)}
              style={{ marginRight: '8px', width: '16px', height: '16px' }}
            />
            <span>📝 绘本文案（TXT格式）</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={screenshots}
              onChange={(e) => setScreenshots(e.target.checked)}
              style={{ marginRight: '8px', width: '16px', height: '16px' }}
            />
            <span>📸 绘本场景截图（包含图片和文案）</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={pdf}
              onChange={(e) => setPdf(e.target.checked)}
              style={{ marginRight: '8px', width: '16px', height: '16px' }}
            />
            <span>📄 绘本PDF（瀑布流格式）</span>
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              backgroundColor: 'white',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.5 : 1
            }}
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '4px', 
              backgroundColor: isExporting ? '#ccc' : '#3b82f6',
              color: 'white',
              cursor: isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            {isExporting ? t('common.exporting') : t('common.startExport')}
          </button>
        </div>
      </div>
    </div>
  );
}
