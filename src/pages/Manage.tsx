import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi, type Book, API_BASE_URL } from '../services/api';
import ExportModal from '../components/ExportModal';
import { ExportService, type ExportOptions } from '../services/exportService';

const VOICE_OPTIONS = {
  'zh_female_shaoergushi_mars_bigtts': '少儿故事（女声）',
  'zh_female_xueayi_saturn_bigtts': '儿童绘本（女声）',
  'zh_male_tiancaitongsheng_mars_bigtts': '天才童声（男声）',
  'zh_female_tianmeixiaoyuan_moon_bigtts': '甜美小源（女声）',
  'zh_female_wenrouxiaoya_moon_bigtts': '温柔小雅（女声）'
};

export default function Manage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [voiceId, setVoiceId] = useState('zh_female_shaoergushi_mars_bigtts');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) loadBook(id);
  }, [id]);

  const loadBook = async (bookId: string) => {
    try {
      const { data } = await bookApi.findOne(bookId);
      setBook(data);
    } catch (error) {
      alert('加载失败');
    }
  };

  const regenerate = async (sceneNumber: number, type: 'image' | 'audio' | 'both') => {
    if (!id) return;
    
    setLoading({ ...loading, [sceneNumber]: true });
    try {
      await bookApi.regenerateScene(id, sceneNumber, type, type !== 'image' ? voiceId : undefined);
      await loadBook(id);
    } catch (error) {
      alert('重新生成失败');
    } finally {
      setLoading({ ...loading, [sceneNumber]: false });
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个绘本吗？')) return;
    
    try {
      await bookApi.delete(id);
      navigate('/');
    } catch (error) {
      alert('删除失败');
    }
  };

  const downloadHtml = () => {
    if (id) window.open(bookApi.downloadHtml(id), '_blank');
  };

  const handleExport = async (options: ExportOptions) => {
    if (!book) return;
    
    setIsExporting(true);
    try {
      await ExportService.exportBook(book.scenes, book.title || '绘本', book._id, options);
      setShowExportModal(false);
    } catch (error) {
      alert('导出失败: ' + error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!book) return <div style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>⚙️ 管理绘本</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowExportModal(true)} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
              📦 导出绘本
            </button>
            <button onClick={downloadHtml} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
              📥 下载HTML
            </button>
            <button onClick={handleDelete} style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
              🗑️ 删除绘本
            </button>
            <button onClick={() => navigate('/')} style={{ backgroundColor: '#6b7280', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
              ← 返回
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>音色选择（用于音频生成）</label>
          <select 
            value={voiceId} 
            onChange={(e) => setVoiceId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
          >
            {Object.entries(VOICE_OPTIONS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {book.scenes.map((scene) => (
          <div key={scene.sceneNumber} style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>场景 {scene.sceneNumber}</h3>
            <p style={{ color: '#374151', marginBottom: '1rem' }}>{scene.content}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                {(scene.imageUrl || scene.imageFilename) && (
                  <img
                    src={scene.imageUrl || `${API_BASE_URL}/uploads/images/${scene.imageFilename}`}
                    alt={`场景${scene.sceneNumber}`}
                    style={{ width: '100%', height: '10rem', objectFit: 'cover', borderRadius: '0.25rem' }}
                  />
                )}
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  {scene.imageUrl || scene.imageFilename ? '✅ 图片已生成' : '❌ 图片未生成'}
                </p>
              </div>
              <div>
                {(scene.audioUrl || scene.audioFilename) && (
                  <audio controls style={{ width: '100%' }}>
                    <source src={scene.audioUrl || `${API_BASE_URL}/uploads/audio/${scene.audioFilename}`} />
                  </audio>
                )}
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  {scene.audioUrl || scene.audioFilename ? '✅ 音频已生成' : '❌ 音频未生成'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => regenerate(scene.sceneNumber, 'image')}
                disabled={loading[scene.sceneNumber]}
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.25rem', 
                  border: 'none', 
                  cursor: loading[scene.sceneNumber] ? 'not-allowed' : 'pointer',
                  opacity: loading[scene.sceneNumber] ? 0.5 : 1
                }}
              >
                🔄 重新生成图片
              </button>
              <button
                onClick={() => regenerate(scene.sceneNumber, 'audio')}
                disabled={loading[scene.sceneNumber]}
                style={{ 
                  backgroundColor: '#8b5cf6', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.25rem', 
                  border: 'none', 
                  cursor: loading[scene.sceneNumber] ? 'not-allowed' : 'pointer',
                  opacity: loading[scene.sceneNumber] ? 0.5 : 1
                }}
              >
                🔄 重新生成音频
              </button>
              <button
                onClick={() => regenerate(scene.sceneNumber, 'both')}
                disabled={loading[scene.sceneNumber]}
                style={{ 
                  backgroundColor: '#6366f1', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.25rem', 
                  border: 'none', 
                  cursor: loading[scene.sceneNumber] ? 'not-allowed' : 'pointer',
                  opacity: loading[scene.sceneNumber] ? 0.5 : 1
                }}
              >
                🔄 全部重新生成
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <ExportModal
        bookId={book?._id || ''}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}
