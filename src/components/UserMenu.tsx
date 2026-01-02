import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败', e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
        >
          {t('nav.login')}
        </button>
        <button
          onClick={() => navigate('/register')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          {t('nav.register')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
        👤 {user.email || user.username || t('common.user', '用户')}
      </span>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.color = '#111827';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.color = '#374151';
        }}
      >
        {t('nav.logout')}
      </button>
    </div>
  );
}
