import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  language?: string;
}

export default function SEO({
  title = 'AI故事书生成器 - 智能儿童绘本创作平台',
  description = 'AI故事书生成器，一键将文字转换为精美儿童绘本。支持自动配图、语音朗读、多种导出格式。让每个孩子都能拥有专属的AI绘本故事。',
  keywords = 'AI故事书,儿童绘本,AI绘本生成,故事创作,语音朗读,自动配图,儿童教育,亲子阅读',
  image = '/favicon.png',
  type = 'website',
  author = 'AI绘本生成器',
  publishedTime,
  language = 'zh-CN'
}: SEOProps) {
  const location = useLocation();
  const url = `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // 更新title
    document.title = title;

    // 更新或创建meta标签
    const updateMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // 基础meta标签
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('author', author);

    // Open Graph标签
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', image.startsWith('http') ? image : `${window.location.origin}${image}`, true);
    updateMeta('og:url', url, true);
    updateMeta('og:type', type, true);
    updateMeta('og:locale', language, true);
    updateMeta('og:site_name', 'AI故事书生成器', true);

    // Twitter Card标签
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image.startsWith('http') ? image : `${window.location.origin}${image}`);

    // 文章特定标签
    if (publishedTime) {
      updateMeta('article:published_time', publishedTime, true);
      updateMeta('article:author', author, true);
    }

    // 更新canonical链接
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // 更新语言标签
    document.documentElement.lang = language;
  }, [title, description, keywords, image, type, author, publishedTime, language, url]);

  return null;
}
