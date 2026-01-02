import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi, type Book, API_BASE_URL } from '../services/api';
import SEO from '../components/SEO';
import BookSchema from '../components/BookSchema';

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [mode, setMode] = useState<'paged' | 'waterfall'>('waterfall');
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) loadBook(id);
  }, [id]);

  useEffect(() => {
    // 当页面切换时，自动播放音频
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentPage]);

  const loadBook = async (bookId: string) => {
    try {
      const { data } = await bookApi.findOne(bookId);
      setBook(data);
    } catch (error) {
      alert('加载失败');
    }
  };

  const downloadPDF = () => {
    if (id) {
      const url = bookApi.downloadPdf(id);
      window.open(url, '_blank');
    }
  };

  const handleAudioEnded = () => {
    if (currentPage < (book?.scenes.length || 0) - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  if (!book) return <div style={{ padding: '2rem' }}>加载中...</div>;

  // SEO数据
  const coverImage: string = book.scenes[0]?.imageUrl || (book.scenes[0]?.imageFilename ? `${API_BASE_URL}/uploads/images/${book.scenes[0].imageFilename}` : '/favicon.png');
  const description: string = book.scenes.slice(0, 2).map(s => s.content).join(' ').substring(0, 150) + '...';
  const keywords: string = `${book.title},儿童绘本,AI绘本,故事书,${book.language === 'zh' ? '中文绘本' : '英文绘本'}`;
  const publishedTime: string = book.createdAt || new Date().toISOString();

  if (mode === 'waterfall') {
    const hasAudio = book.scenes.some(s => s.audioUrl || s.audioFilename);
    
    return (
      <>
        <SEO
          title={`${book.title} - AI儿童绘本`}
          description={description}
          keywords={keywords}
          image={coverImage}
          type="book"
          publishedTime={publishedTime}
          language={book.language === 'zh' ? 'zh-CN' : 'en-US'}
        />
        <BookSchema
          name={book.title || '未命名绘本'}
          description={description}
          image={coverImage}
          datePublished={publishedTime}
          inLanguage={book.language === 'zh' ? 'zh-CN' : 'en-US'}
          numberOfPages={book.scenes.length}
        />
        <article style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
          <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{book.title}</h1>
              <button onClick={() => setMode('paged')} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                📄 切换到翻页模式
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              {hasAudio && (
                <button
                  onClick={togglePlay}
                  style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)', 
                    border: 'none', 
                    color: 'white', 
                    fontSize: '1.25rem', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
              )}
              <button onClick={downloadPDF} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                📥 导出PDF
              </button>
              <button onClick={() => navigate('/')} style={{ backgroundColor: '#6b7280', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                ← 返回
              </button>
            </div>
          
          <div>
            {book.scenes.map((scene) => (
              <section key={scene.sceneNumber} style={{ marginBottom: '2rem' }}>
                <figure style={{ margin: 0 }}>
                  <img
                    src={scene.imageUrl || `${API_BASE_URL}/uploads/images/${scene.imageFilename}`}
                    alt={`${book.title} - 场景${scene.sceneNumber}: ${scene.content.substring(0, 50)}`}
                    title={`场景${scene.sceneNumber}`}
                    style={{ width: '100%', display: 'block', marginBottom: '0' }}
                  />
                  <figcaption style={{ fontSize: '1.25rem', lineHeight: '1.625', padding: '2rem', backgroundColor: 'white', margin: '0' }}>
                    {scene.content}
                  </figcaption>
                </figure>
              </section>
            ))}
            
            {/* 隐藏的音频元素，用于播放当前场景 */}
            {(book.scenes[currentPage]?.audioUrl || book.scenes[currentPage]?.audioFilename) && (
              <audio
                ref={audioRef}
                src={book.scenes[currentPage]?.audioUrl || `${API_BASE_URL}/uploads/audio/${book.scenes[currentPage]?.audioFilename}`}
                onEnded={handleAudioEnded}
                style={{ display: 'none' }}
              />
            )}
          </div>
        </div>
      </article>
      </>
    );
  }

  const scene = book.scenes[currentPage];

  return (
    <>
      <SEO
        title={`${book.title} - AI儿童绘本`}
        description={description}
        keywords={keywords}
        image={coverImage}
        type="book"
        publishedTime={publishedTime}
        language={book.language === 'zh' ? 'zh-CN' : 'en-US'}
      />
      <BookSchema
        name={book.title || '未命名绘本'}
        description={description}
        image={coverImage}
        datePublished={publishedTime}
        inLanguage={book.language === 'zh' ? 'zh-CN' : 'en-US'}
        numberOfPages={book.scenes.length}
      />
    <div style={{ minHeight: '100vh', backgroundColor: 'white', color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{ backgroundColor: '#f3f4f6', color: 'black', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', cursor: 'pointer' }}
        >
          ← 返回
        </button>
        <button
          onClick={downloadPDF}
          style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
        >
          📥 导出PDF
        </button>
      </div>
      
      <button
        onClick={() => setMode('waterfall')}
        style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#8b5cf6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
      >
        🌊 切换到瀑布流
      </button>

      <div style={{ maxWidth: '64rem', width: '100%' }}>
        <img
          src={scene.imageUrl || `${API_BASE_URL}/uploads/images/${scene.imageFilename}`}
          alt={`场景${scene.sceneNumber}`}
          style={{ width: '100%', maxHeight: '60vh', objectFit: 'cover', borderRadius: '0.75rem', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <p style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem', color: '#374151' }}>{scene.content}</p>
        
        {(scene.audioUrl || scene.audioFilename) && (
          <audio
            ref={audioRef}
            src={scene.audioUrl || `${API_BASE_URL}/uploads/audio/${scene.audioFilename}`}
            onEnded={handleAudioEnded}
          />
        )}
      </div>

      {/* 控制按钮：有音频显示播放按钮，无音频显示翻页按钮 */}
      {(scene.audioUrl || scene.audioFilename) ? (
        <div style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem' }}>
          <button
            onClick={togglePlay}
            style={{ 
              width: '4.5rem', 
              height: '4.5rem', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #a855f7, #6366f1)', 
              border: 'none', 
              color: 'white', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      ) : (
        <div style={{ position: 'fixed', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{ 
              padding: '12px 24px',
              borderRadius: '8px',
              background: currentPage === 0 ? '#ccc' : 'linear-gradient(135deg, #a855f7, #6366f1)',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            ← 上一页
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(book.scenes.length - 1, currentPage + 1))}
            disabled={currentPage === book.scenes.length - 1}
            style={{ 
              padding: '12px 24px',
              borderRadius: '8px',
              background: currentPage === book.scenes.length - 1 ? '#ccc' : 'linear-gradient(135deg, #a855f7, #6366f1)',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: currentPage === book.scenes.length - 1 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
    </>
  );
}
