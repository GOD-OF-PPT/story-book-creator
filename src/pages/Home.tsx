import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sceneApi, bookApi } from '../services/api';
import type { Book } from '../services/api';
import StorybookCreator from '../components/StorybookCreator';
import UserMenu from '../components/UserMenu';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SEO from '../components/SEO';
import { generateAndUploadResources } from '../services/resourceService';
import { checkGenerationLimitWithBackend } from '../utils/generationLimit';
import { getDeviceFingerprint } from '../utils/fingerprint';

function Home() {
  const { t, i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [storyText, setStoryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ createRemaining: number; randomRemaining: number; limit: number; isMember: boolean; pending?: boolean } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
    loadLimitInfo();
  }, [i18n.language]);

  // 监听用户登录状态变化
  useEffect(() => {
    const checkUserChange = () => {
      loadLimitInfo();
    };
    
    window.addEventListener('storage', checkUserChange);
    window.addEventListener('userLogin', checkUserChange);
    
    return () => {
      window.removeEventListener('storage', checkUserChange);
      window.removeEventListener('userLogin', checkUserChange);
    };
  }, []);

  const loadBooks = async () => {
    try {
      const { data } = await bookApi.findAll();
      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载失败:', error);
      setBooks([]);
    }
  };

  const loadLimitInfo = async () => {
    try {
      const check = await checkGenerationLimitWithBackend('all');
      setLimitInfo({
        createRemaining: check.createRemaining,
        randomRemaining: check.randomRemaining,
        limit: check.limit,
        isMember: check.isMember
      });
    } catch (error) {
      console.error('获取限制信息失败:', error);
    }
  };

  const handleSubmit = async (imageModel?: 'doubao', generateAudio: boolean = true, language: string = 'zh', isPublic: boolean = false) => {
    if (!storyText.trim()) return;
    
    if (storyText.length < 1) {
      alert('故事内容过短，请输入至少100个字符的故事内容');
      return;
    }

    if (storyText.length > 1500) {
      alert('故事内容过长，请控制在1500个字符以内');
      return;
    }

    // 后端验证生成限制
    const backendCheck = await checkGenerationLimitWithBackend('create');
    if (!backendCheck.canGenerate) {
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await sceneApi.split(storyText, language);
      console.log('[Frontend] 场景拆分结果:', data);
      
      const fingerprint = await getDeviceFingerprint();
      const { data: book } = await bookApi.create(
        data.title || t('book.untitled'), 
        data.scenes,
        language,
        isPublic,
        false,
        'create',
        fingerprint
      );

      // 立即刷新列表，显示刚创建的绘本
      await loadBooks();
      
      // 等待生成资源完成
      await generateAndUploadResources(
        book._id,
        undefined,
        imageModel,
        generateAudio,
        (progress) => {
          if (progress.progress !== undefined) {
            console.log(`[创建生成进度] ${progress.progress.toFixed(1)}% - 场景${progress.sceneNumber} ${progress.resourceType} - ${progress.stage}`);
          } else {
            console.log(`[创建生成进度] 场景${progress.sceneNumber} ${progress.resourceType} - ${progress.stage}`);
          }
        }
      );
      
      console.log('[Home] handleSubmit - 生成完成，刷新列表和限制信息');
      await loadBooks();
      await loadLimitInfo();
      
      setStoryText('');
    } catch (error) {
      console.error('[Home] handleSubmit - 生成失败:', error);
      alert('生成失败: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomGenerate = async (imageModel?: 'doubao', generateAudio: boolean = true, language: string = 'zh', isPublic: boolean = false) => {
    // 后端验证生成限制（带设备指纹）
    const backendCheck = await checkGenerationLimitWithBackend('random');
    if (!backendCheck.canGenerate) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await sceneApi.random(language);
      console.log('[Frontend] 随机生成结果:', data);
      
      const fingerprint = await getDeviceFingerprint();
      const { data: book } = await bookApi.create(
        data.title || t('book.untitled'), 
        data.scenes,
        language,
        isPublic,
        false,
        'random',
        fingerprint
      );

      // 立即刷新列表，显示刚创建的绘本
      await loadBooks();
      
      // 等待生成资源完成
      await generateAndUploadResources(
        book._id,
        undefined,
        imageModel,
        generateAudio,
        (progress) => {
          if (progress.progress !== undefined) {
            console.log(`[随机生成进度] ${progress.progress.toFixed(1)}% - 场景${progress.sceneNumber} ${progress.resourceType} - ${progress.stage}`);
          } else {
            console.log(`[随机生成进度] 场景${progress.sceneNumber} ${progress.resourceType} - ${progress.stage}`);
          }
        }
      );
      
      console.log('[Home] handleRandomGenerate - 生成完成，刷新列表和限制信息');
      await loadBooks();
      await loadLimitInfo();
    } catch (error) {
      console.error('[Home] handleRandomGenerate - 生成失败:', error);
      alert('随机生成失败: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO />
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* 导航栏 */}
          <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          padding: '16px 24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h1 style={{ margin: 0, color: '#333', fontSize: '1.75rem', fontWeight: '700' }}>
            {t('app.title')}
          </h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>

        {/* 温馨提示 - 仅中文显示 */}
        {i18n.language === 'zh' && (
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            padding: '16px 24px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>温馨提示</div>
              <div style={{ fontSize: '14px', opacity: 0.95 }}>
                语音图片资源生成成本昂贵，请勿大批量生成。如有商业需求，可联系微信：<strong>huxiaonb</strong>
              </div>
            </div>
          </div>
        )}

        <StorybookCreator 
          storyText={storyText}
          setStoryText={setStoryText}
          loading={loading}
          books={books}
          handleSubmit={handleSubmit}
          handleRandomGenerate={handleRandomGenerate}
          navigate={navigate}
          limitInfo={limitInfo}
        />
      </div>
    </div>
    </>
  );
}

export default Home;
