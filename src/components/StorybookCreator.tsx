import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book } from '../services/api';
import { API_BASE_URL } from '../services/api';

interface StorybookCreatorProps {
  storyText: string;
  setStoryText: (text: string) => void;
  loading: boolean;
  books: Book[];
  handleSubmit: (imageModel?: 'doubao', generateAudio?: boolean, language?: string, isPublic?: boolean) => void;
  handleRandomGenerate: (imageModel?: 'doubao', generateAudio?: boolean, language?: string, isPublic?: boolean) => void;
  navigate: (path: string) => void;
  limitInfo: { createRemaining: number; randomRemaining: number; limit: number; isMember: boolean; pending?: boolean } | null;
}

const StorybookCreator: React.FC<StorybookCreatorProps> = ({
  storyText,
  setStoryText,
  loading,
  books,
  handleSubmit,
  handleRandomGenerate,
  navigate,
  limitInfo
}) => {
  const { t, i18n } = useTranslation();
  const [generateAudio, setGenerateAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'zh' | 'en'>('all');
  const [audioFilter, setAudioFilter] = useState<'all' | 'with' | 'without'>('all');
  
  // 当界面语言切换时，同步更新筛选器
  useEffect(() => {
    setLanguageFilter(i18n.language as 'zh' | 'en');
  }, [i18n.language]);
  
  // 获取当前用户
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user._id || user.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentUserId = getCurrentUserId();
  const [isPublic, setIsPublic] = useState(!currentUserId); // 未登录默认公开
  
  // 根据语言和音频筛选绘本
  let filteredBooks = books;
  
  // 语言筛选
  if (languageFilter !== 'all') {
    filteredBooks = filteredBooks.filter(book => book.language === languageFilter);
  }
  
  // 音频筛选
  if (audioFilter === 'with') {
    filteredBooks = filteredBooks.filter(book => book.hasAudio === true);
  } else if (audioFilter === 'without') {
    filteredBooks = filteredBooks.filter(book => book.hasAudio !== true);
  }
  
  const myBooks = filteredBooks.filter(book => book.userId && book.userId === currentUserId);
  const publicBooks = filteredBooks.filter(book => book.isPublic && (!currentUserId || book.userId !== currentUserId));

  return (
    <>
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>✨ {t('book.newBook')}</h2>
        <textarea
          style={{ width: '100%', height: '128px', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '8px', fontSize: '16px' }}
          placeholder={t('book.storyPlaceholder')}
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.875rem', color: storyText.length < 100 ? '#ef4444' : storyText.length > 1500 ? '#ef4444' : '#6b7280' }}>
            {storyText.length} / 1500 {t('book.characters')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={generateAudio}
              onChange={(e) => setGenerateAudio(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>{t('book.generateAudio', '生成语音朗读')}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
              {isPublic ? '🌍 ' : '🔒 '}
              {t('book.isPublic')}
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <button
            onClick={() => handleSubmit('doubao', generateAudio, i18n.language as 'zh' | 'en', isPublic)}
            disabled={loading || !!(limitInfo && (limitInfo.createRemaining === 0 || limitInfo.pending))}
            style={{ 
              flex: 1,
              background: (loading || !!(limitInfo && (limitInfo.createRemaining === 0 || limitInfo.pending))) ? '#ccc' : 'linear-gradient(to right, #a855f7, #6366f1)', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: (loading || !!(limitInfo && (limitInfo.createRemaining === 0 || limitInfo.pending))) ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {limitInfo?.pending ? t('book.generating') : loading ? t('book.generating') : `🚀 ${t('book.create')}`}
          </button>
          
          <button
            onClick={() => handleRandomGenerate('doubao', generateAudio, i18n.language as 'zh' | 'en', isPublic)}
            disabled={loading || !!(limitInfo && (limitInfo.randomRemaining === 0 || limitInfo.pending))}
            style={{ 
              background: (loading || !!(limitInfo && (limitInfo.randomRemaining === 0 || limitInfo.pending))) ? '#ccc' : 'linear-gradient(to right, #ec4899, #f59e0b)', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: (loading || !!(limitInfo && (limitInfo.randomRemaining === 0 || limitInfo.pending))) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              whiteSpace: 'nowrap'
            }}
          >
            {limitInfo?.pending ? t('book.generating') : loading ? t('book.generating') : `🎲 ${t('book.randomGenerate')}`}
          </button>
        </div>

        {/* 限制次数提示 */}
        {limitInfo && (
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            padding: '10px 16px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#374151',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📝</span>
              <span style={{ fontWeight: '500' }}>{t('book.customGeneration', '自定义生成')}:</span>
              <span style={{ fontWeight: '600', color: limitInfo.createRemaining === 0 ? '#ef4444' : '#10b981' }}>
                {limitInfo.createRemaining}/{limitInfo.limit}
              </span>
            </span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎲</span>
              <span style={{ fontWeight: '500' }}>{t('book.randomGeneration', '随机生成')}:</span>
              <span style={{ fontWeight: '600', color: limitInfo.randomRemaining === 0 ? '#ef4444' : '#10b981' }}>
                {limitInfo.randomRemaining}/{limitInfo.limit}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setActiveTab('public')}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'public' ? '#3b82f6' : '#6b7280',
              borderBottom: activeTab === 'public' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🌍 {t('nav.publicBooks')} ({publicBooks.length})
          </button>
          {currentUserId && (
            <button
              onClick={() => setActiveTab('my')}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'my' ? '#3b82f6' : '#6b7280',
                borderBottom: activeTab === 'my' ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📚 {t('nav.myBooks')} ({myBooks.length})
            </button>
          )}
        </div>
        
        {/* 筛选器 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '-2px' }}>
          {/* 语言筛选 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('book.language')}:</span>
            <button
              onClick={() => setLanguageFilter('all')}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: languageFilter === 'all' ? '#3b82f6' : 'white',
                color: languageFilter === 'all' ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t('common.all', '全部')}
            </button>
            <button
              onClick={() => setLanguageFilter('zh')}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: languageFilter === 'zh' ? '#3b82f6' : 'white',
                color: languageFilter === 'zh' ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              中文
            </button>
            <button
              onClick={() => setLanguageFilter('en')}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: languageFilter === 'en' ? '#3b82f6' : 'white',
                color: languageFilter === 'en' ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              English
            </button>
          </div>
          
          {/* 音频筛选 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('book.audio', '音频')}:</span>
            <button
              onClick={() => setAudioFilter('all')}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: audioFilter === 'all' ? '#3b82f6' : 'white',
                color: audioFilter === 'all' ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t('common.all', '全部')}
            </button>
            <button
              onClick={() => setAudioFilter('with')}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: audioFilter === 'with' ? '#3b82f6' : 'white',
                color: audioFilter === 'with' ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🎵 {t('book.withAudio', '有语音')}
            </button>
            <button
              onClick={() => setAudioFilter('without')}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: audioFilter === 'without' ? '#3b82f6' : 'white',
                color: audioFilter === 'without' ? 'white' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔇 {t('book.withoutAudio', '无语音')}
            </button>
          </div>
        </div>
      </div>

      {/* 我的绘本 Tab */}
      {activeTab === 'my' && myBooks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {myBooks.map((book) => {
            const totalScenes = book.scenes?.length || 0;
            const completedImages = book.scenes?.filter(s => s.imageStatus === 'completed').length || 0;
            const completedAudios = book.scenes?.filter(s => s.audioStatus === 'completed').length || 0;
            const isComplete = typeof book.status === 'object' ? book.status.isComplete === true : book.status === 'completed';
            const isFailed = book.scenes?.some(s => s.imageStatus === 'failed' || s.audioStatus === 'failed');
            const isGenerating = !isComplete && !isFailed;
            
            console.log('[StorybookCreator] 绘本状态:', {
              bookId: book._id,
              status: book.status,
              isComplete,
              isFailed,
              isGenerating
            });
            
            const handlePreviewClick = () => {
              if (isGenerating) {
                alert(t('book.generatingAlert'));
                return;
              }
              navigate(`/book/preview/${book._id}`);
            };
            
            return (
              <div key={book._id} style={{ 
                background: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                padding: '24px', 
                opacity: isComplete ? 1 : 0.6,
                border: isFailed ? '2px solid #ef4444' : 'none',
                position: 'relative'
              }}>
                {isGenerating && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}>
                    <div 
                      className="spinner"
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f4f6',
                        borderTop: '4px solid #a855f7',
                        borderRadius: '50%'
                      }}
                    ></div>
                    <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                      {t('book.generating')}
                    </div>
                  </div>
                )}
                
                <div 
                  style={{ background: book.coverImage ? 'transparent' : 'linear-gradient(135deg, #a855f7, #6366f1)', height: '160px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '16px', overflow: 'hidden', cursor: isGenerating ? 'not-allowed' : 'pointer' }}
                  onClick={handlePreviewClick}
                >
                  {book.coverImage ? (
                    <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_BASE_URL}/uploads/images/${book.coverImage}`} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '📖'
                  )}
                </div>
                <h3 style={{ fontWeight: '600', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title || t('book.untitled')}</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '8px' }}>🎬 {totalScenes} {t('book.scenes')}</p>
                <p style={{ fontSize: '0.875rem', color: isFailed ? '#ef4444' : '#666', marginBottom: '16px' }}>
                  🖼️ {completedImages}/{totalScenes} {t('book.images')}
                  {book.hasAudio && <> | 🎵 {completedAudios}/{totalScenes} {t('book.audios')}</>}
                  {isFailed && <span style={{ color: '#ef4444', marginLeft: '8px' }}>⚠️ {t('book.failed')}</span>}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handlePreviewClick}
                    disabled={isGenerating}
                    style={{ flex: 1, background: isGenerating ? '#ccc' : '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                  >
                    {t('book.preview')}
                  </button>
                  <button
                    onClick={() => {
                      if (isGenerating) {
                        alert(t('book.generatingAlert'));
                        return;
                      }
                      const url = `${API_BASE_URL}/book/${book._id}/export`;
                      window.open(url, '_blank');
                    }}
                    disabled={isGenerating}
                    style={{ flex: 1, background: isGenerating ? '#ccc' : '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                  >
                    📥 {t('book.export')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 公开绘本 Tab */}
      {activeTab === 'public' && publicBooks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {publicBooks.map((book) => {
            const totalScenes = book.scenes?.length || 0;
            const completedImages = book.scenes?.filter(s => s.imageStatus === 'completed').length || 0;
            const completedAudios = book.scenes?.filter(s => s.audioStatus === 'completed').length || 0;
            const isComplete = typeof book.status === 'object' ? book.status.isComplete === true : book.status === 'completed';
            const isFailed = book.scenes?.some(s => s.imageStatus === 'failed' || s.audioStatus === 'failed');
            const isGenerating = !isComplete && !isFailed;
            
            return (
              <div key={book._id} style={{ 
                background: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                padding: '24px', 
                opacity: isComplete ? 1 : 0.6,
                position: 'relative'
              }}>
                {isGenerating && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}>
                    <div 
                      className="spinner"
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f4f6',
                        borderTop: '4px solid #10b981',
                        borderRadius: '50%'
                      }}
                    ></div>
                    <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                      {t('book.generating')}
                    </div>
                  </div>
                )}
                
                <div 
                  style={{ background: book.coverImage ? 'transparent' : 'linear-gradient(135deg, #10b981, #3b82f6)', height: '160px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '16px', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => navigate(`/book/preview/${book._id}`)}
                >
                  {book.coverImage ? (
                    <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_BASE_URL}/uploads/images/${book.coverImage}`} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '📖'
                  )}
                </div>
                <h3 style={{ fontWeight: '600', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title || t('book.untitled')}</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '8px' }}>🎬 {totalScenes} {t('book.scenes')}</p>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '16px' }}>
                  🖼️ {completedImages}/{totalScenes} {t('book.images')}
                  {book.hasAudio && <> | 🎵 {completedAudios}/{totalScenes} {t('book.audios')}</>}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/book/preview/${book._id}`)}
                    style={{ flex: 1, background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    {t('book.preview')}
                  </button>
                  <button
                    onClick={() => {
                      if (!currentUserId) {
                        navigate('/login');
                        return;
                      }
                      const url = `${API_BASE_URL}/book/${book._id}/export`;
                      window.open(url, '_blank');
                    }}
                    style={{ flex: 1, background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    📥 {t('book.export')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default StorybookCreator;
