import { useEffect } from 'react';

interface BookSchemaProps {
  name: string;
  description?: string;
  image?: string;
  datePublished?: string;
  inLanguage?: string;
  numberOfPages?: number;
  author?: string;
}

export default function BookSchema({
  name,
  description,
  image,
  datePublished,
  inLanguage = 'zh-CN',
  numberOfPages,
  author = 'AI绘本生成器'
}: BookSchemaProps) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name,
      author: {
        '@type': 'Organization',
        name: author
      },
      ...(description && { description }),
      ...(image && { image }),
      ...(datePublished && { datePublished }),
      inLanguage,
      ...(numberOfPages && { numberOfPages }),
      genre: '儿童绘本',
      bookFormat: 'https://schema.org/EBook',
      isAccessibleForFree: true
    };

    // 移除旧的schema标签
    const oldScript = document.querySelector('script[type="application/ld+json"]');
    if (oldScript) {
      oldScript.remove();
    }

    // 添加新的schema标签
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, image, datePublished, inLanguage, numberOfPages, author]);

  return null;
}
