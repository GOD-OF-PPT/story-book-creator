import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { uploadResourceWithFallback } from '../utils/r2Upload';
import { API_BASE_URL } from '../services/api';


interface Scene {
  sceneNumber: number;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  imageStatus?: string;
  audioStatus?: string;
}

interface Book {
  _id: string;
  title: string;
  status: string;
  scenes: Scene[];
}

interface FailedBook {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  failedScenes: number;
  totalScenes: number;
}

export default function CompensateUpload() {
  const [books, setBooks] = useState<Book[]>([]);
  const [failedBooks, setFailedBooks] = useState<FailedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUploadingBooks();
    loadFailedBooks();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const loadUploadingBooks = async () => {
    try {
      addLog('开始查询待上传资源...');
      const response = await axios.get(`${API_BASE_URL}/book/uploading`);
      setBooks(response.data);
      addLog(`找到 ${response.data.length} 个待上传绘本`);
    } catch (error) {
      addLog(`查询失败: ${error}`);
    }
  };

  const loadFailedBooks = async () => {
    try {
      addLog('开始查询失败绘本...');
      const response = await axios.get(`${API_BASE_URL}/book/failed`);
      setFailedBooks(response.data);
      addLog(`找到 ${response.data.length} 个失败绘本`);
    } catch (error) {
      addLog(`查询失败绘本失败: ${error}`);
    }
  };

  const startCompensateUpload = async () => {
    if (books.length === 0) {
      addLog('没有待上传的资源');
      return;
    }

    setLoading(true);
    addLog('开始补偿上传...');

    for (const book of books) {
      addLog(`\n处理绘本: ${book.title} (${book._id})`);

      for (const scene of book.scenes) {
        // 上传图片
        if (scene.imageStatus === 'uploading' && scene.imageUrl) {
          addLog(`  场景${scene.sceneNumber}: 开始上传图片`);
          try {
            await uploadResourceWithFallback(
              book._id,
              scene.sceneNumber,
              scene.imageUrl,
              'image'
            );
            addLog(`  场景${scene.sceneNumber}: 图片上传成功`);
          } catch (error) {
            addLog(`  场景${scene.sceneNumber}: 图片上传失败 - ${error}`);
          }
        }

        // 上传音频
        if (scene.audioStatus === 'uploading' && scene.audioUrl) {
          addLog(`  场景${scene.sceneNumber}: 开始上传音频`);
          try {
            await uploadResourceWithFallback(
              book._id,
              scene.sceneNumber,
              scene.audioUrl,
              'audio'
            );
            addLog(`  场景${scene.sceneNumber}: 音频上传成功`);
          } catch (error) {
            addLog(`  场景${scene.sceneNumber}: 音频上传失败 - ${error}`);
          }
        }
      }
    }

    addLog('\n补偿上传完成！');
    setLoading(false);
    
    // 刷新列表
    await loadUploadingBooks();
  };

  const startCleanFailed = async () => {
    if (failedBooks.length === 0) {
      addLog('没有失败的绘本需要清理');
      return;
    }

    if (!confirm(`确定要删除 ${failedBooks.length} 个失败的绘本吗？此操作不可恢复！`)) {
      return;
    }

    setLoading(true);
    addLog('\n开始清理失败绘本...');

    for (const book of failedBooks) {
      addLog(`删除绘本: ${book.title} (${book._id})`);
      try {
        await axios.delete(`${API_BASE_URL}/book/${book._id}`);
        addLog(`  删除成功`);
      } catch (error) {
        addLog(`  删除失败: ${error}`);
      }
    }

    addLog('\n清理完成！');
    setLoading(false);
    
    // 刷新列表
    await loadFailedBooks();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            📦 补偿上传
          </h1>
          <button
            onClick={() => navigate('/')}
            style={{ background: '#6b7280', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            ← 返回首页
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>待上传资源</h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                找到 {books.length} 个绘本，共 {books.reduce((sum, book) => 
                  sum + book.scenes.filter(s => s.imageStatus === 'uploading' || s.audioStatus === 'uploading').length, 0
                )} 个待上传场景
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={loadUploadingBooks}
                disabled={loading}
                style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                🔄 刷新
              </button>
              <button
                onClick={startCompensateUpload}
                disabled={loading || books.length === 0}
                style={{ background: loading ? '#ccc' : '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: (loading || books.length === 0) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? '上传中...' : '🚀 开始上传'}
              </button>
            </div>
          </div>

          {books.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              {books.map(book => (
                <div key={book._id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{book.title}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {book.scenes.filter(s => s.imageStatus === 'uploading').length} 个图片待上传，
                    {book.scenes.filter(s => s.audioStatus === 'uploading').length} 个音频待上传
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 失败绘本区域 */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>失败绘本</h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                找到 {failedBooks.length} 个失败绘本
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={loadFailedBooks}
                disabled={loading}
                style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                🔄 刷新
              </button>
              <button
                onClick={startCleanFailed}
                disabled={loading || failedBooks.length === 0}
                style={{ background: loading || failedBooks.length === 0 ? '#ccc' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: (loading || failedBooks.length === 0) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? '清理中...' : '🗑️ 清理全部'}
              </button>
            </div>
          </div>

          {failedBooks.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              {failedBooks.map(book => (
                <div key={book._id} style={{ padding: '12px', background: '#fef2f2', borderRadius: '6px', marginBottom: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', color: '#dc2626' }}>{book.title}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {book.failedScenes} / {book.totalScenes} 个场景失败
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📋 上传日志</h2>
          <div style={{ 
            background: '#1f2937', 
            color: '#f3f4f6', 
            padding: '16px', 
            borderRadius: '6px', 
            fontFamily: 'monospace', 
            fontSize: '13px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#9ca3af' }}>等待开始...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
