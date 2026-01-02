import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Preview from './pages/Preview';
import Manage from './pages/Manage';
import PPTPreview from './pages/PPTPreview';
import CompensateUpload from './pages/CompensateUpload';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import './index.css';
import './i18n/config';
import { getLanguagePreference, saveLanguagePreference, cleanupExpiredData } from './utils/generationLimit';
import { initFingerprint } from './utils/fingerprint';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 初始化设备指纹
    initFingerprint().catch(console.error);
    
    // 恢复语言偏好
    const savedLang = getLanguagePreference();
    if (savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }

    // 监听语言变化并保存
    const handleLanguageChange = (lng: string) => {
      saveLanguagePreference(lng as 'zh' | 'en');
    };
    i18n.on('languageChanged', handleLanguageChange);

    // 清理过期数据
    cleanupExpiredData();

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <BrowserRouter basename="/story">
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* 认证路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* 绘本相关路由 */}
        <Route path="/book/preview/:id" element={<Preview />} />
        <Route path="/book/manage/:id" element={<Manage />} />
        <Route path="/book/compensate" element={<CompensateUpload />} />
        
        {/* 兼容旧路由 */}
        <Route path="/preview/:id" element={<Preview />} />
        <Route path="/manage/:id" element={<Manage />} />
        
        {/* PPT 相关路由 */}
        <Route path="/ppt/preview/:id" element={<PPTPreview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
