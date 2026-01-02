import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const activeStyle = {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const inactiveStyle = {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: '#e5e7eb',
    color: '#374151'
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => changeLanguage('zh')}
        style={i18n.language === 'zh' ? activeStyle : inactiveStyle}
        onMouseEnter={(e) => {
          if (i18n.language !== 'zh') {
            e.currentTarget.style.backgroundColor = '#d1d5db';
          }
        }}
        onMouseLeave={(e) => {
          if (i18n.language !== 'zh') {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }
        }}
      >
        中文
      </button>
      <button
        onClick={() => changeLanguage('en')}
        style={i18n.language === 'en' ? activeStyle : inactiveStyle}
        onMouseEnter={(e) => {
          if (i18n.language !== 'en') {
            e.currentTarget.style.backgroundColor = '#d1d5db';
          }
        }}
        onMouseLeave={(e) => {
          if (i18n.language !== 'en') {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }
        }}
      >
        English
      </button>
    </div>
  );
}
