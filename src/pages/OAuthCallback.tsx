import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // 保存token
      localStorage.setItem('token', token);
      
      // 获取用户信息
      fetch('http://127.0.0.1:3000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            localStorage.setItem('user', JSON.stringify(data.data));
            window.dispatchEvent(new Event('userLogin'));
            navigate('/');
          } else {
            navigate('/login');
          }
        })
        .catch(() => {
          navigate('/login');
        });
    } else {
      // 没有token，登录失败
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>登录中...</div>
      </div>
    </div>
  );
}
