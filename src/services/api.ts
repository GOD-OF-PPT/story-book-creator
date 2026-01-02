import axios from 'axios';

export const API_BASE_URL = 'https://api.nm-cv.com';
// export const API_BASE_URL = 'http://127.0.0.1:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器：添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/story/login';
    }
    return Promise.reject(error);
  }
);

export interface Scene {
  scene_number: number;
  content: string;
}

export interface Book {
  _id: string;
  id?: string;
  title?: string;
  userId?: string;
  isPublic?: boolean;
  language?: string;
  hasAudio?: boolean;
  createdAt: string;
  coverImage?: string;
  status?: 'pending' | 'generating' | 'completed' | 'failed' | 'uploading' | {
    isComplete: boolean;
    totalScenes: number;
    completedImages: number;
    completedAudios: number;
  };
  scenes: Array<{
    sceneNumber: number;
    content: string;
    imageFilename?: string;
    audioFilename?: string;
    imageUrl?: string;
    audioUrl?: string;
    imageStatus?: 'pending' | 'generating' | 'uploading' | 'completed' | 'failed';
    audioStatus?: 'pending' | 'generating' | 'uploading' | 'completed' | 'failed';
  }>;
}

export interface PPT {
  _id: string;
  title: string;
  sourceType: 'text' | 'document' | 'url';
  theme: 'business' | 'creative' | 'minimal';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  totalSlides: number;
  completedSlides: number;
  createdAt: string;
  sourceContent?: string; // HTML PPT内容
  slides: Array<{
    slideNumber: number;
    type: 'cover' | 'content' | 'summary';
    title: string;
    content: string;
    imageFilename?: string;
    imageStatus: 'pending' | 'generating' | 'completed' | 'failed';
  }>;
}

export const configApi = {
  getGenerationLimits: () => api.get<{ anonymousLimit: number; userDailyLimit: number; memberDailyLimit: number }>('/config/generation-limits'),
};

export const membershipApi = {
  getMembershipStatus: () => api.get<{ isMember: boolean; membershipType?: string; expiresAt?: string; daysRemaining?: number }>('/membership/status')
};

export const generationApi = {
  checkLimit: (type: 'create' | 'random' | 'all', fingerprint?: string) => 
    api.post<{ canGenerate: boolean; createRemaining: number; randomRemaining: number; limit: number; isAuthenticated: boolean; isMember: boolean; userType: string; pending?: boolean }>('/generation/check-limit', { type, fingerprint }),
  record: (type: 'create' | 'random', fingerprint?: string) => 
    api.post<{ success: boolean }>('/generation/record', { type, fingerprint })
};

export const sceneApi = {
  split: (storyText: string, language?: string) => api.post<{ title: string; scenes: Scene[] }>('/scene/split', { storyText, language }),
  random: (language?: string) => api.get<{ title: string; scenes: Scene[] }>('/scene/random', { params: { language } }),
};

export const bookApi = {
  create: (title: string, scenes: Scene[], language?: string, isPublic?: boolean, hasAudio?: boolean, generationType?: 'create' | 'random', fingerprint?: string) => {
    console.log('[Frontend] 创建绘本请求:', { title, scenes, language, isPublic, hasAudio, generationType, fingerprint });
    return api.post<Book>('/book', { title, scenes, language, isPublic, hasAudio, generationType, fingerprint });
  },
  findAll: (language?: string) => api.get<Book[]>('/book', { params: language ? { language } : {} }),
  findOne: (id: string) => api.get<Book>(`/book/${id}`),
  generate: (id: string, voiceId?: string, imageModel?: 'doubao', generateAudio: boolean = true) => 
    api.post<{ bookId: string; message: string }>(`/book/${id}/generate`, { voiceId, imageModel, generateAudio }),
  regenerateScene: (id: string, sceneNumber: number, type: 'image' | 'audio' | 'both', voiceId?: string) =>
    api.post(`/book/${id}/regenerate/${sceneNumber}`, { type, voiceId }),
  updateSceneResource: (bookId: string, sceneNumber: number, type: 'image' | 'audio', r2Url: string) =>
    api.patch(`/book/${bookId}/scene/${sceneNumber}/resource`, { type, r2Url }),
  fallbackUpload: (bookId: string, sceneNumber: number, type: 'image' | 'audio', sourceUrl: string) =>
    api.post<{ r2Url: string }>(`/book/${bookId}/scene/${sceneNumber}/fallback-upload`, { type, sourceUrl }),
  downloadHtml: (id: string) => `${API_BASE_URL}/book/${id}/html`,
  downloadPdf: (id: string) => `${API_BASE_URL}/book/${id}/pdf`,
  delete: (id: string) => api.delete(`/book/${id}`),
};

export const r2Api = {
  getPresignedUrl: async (key: string, contentType: string) => {
    const response = await api.post<{ uploadUrl: string; publicUrl: string }>('/r2/presigned-url', {
      key,
      contentType,
    });
    return response.data;
  },
};

export const pptApi = {
  createFromText: (content: string, theme?: string, title?: string, useHTML?: boolean) => 
    api.post<PPT>('/ppt/generate', { content, theme, title, useHTML }),
  createFromUrl: (url: string, theme?: string, useHTML?: boolean) => 
    api.post<PPT>('/ppt/generate/url', { url, theme, useHTML }),
  createFromDocument: (file: File, theme?: string, useHTML?: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    if (theme) formData.append('theme', theme);
    if (useHTML !== undefined) formData.append('useHTML', useHTML.toString());
    return api.post<PPT>('/ppt/generate/document', formData);
  },
  findAll: () => api.get<PPT[]>('/ppt'),
  findOne: (id: string) => api.get<PPT>(`/ppt/${id}`),
  generateImages: (id: string) => api.post(`/ppt/${id}/generate-images`),
  regenerateSlideImage: (id: string, slideNumber: number) => 
    api.post(`/ppt/${id}/slides/${slideNumber}/regenerate-image`),
  updateTheme: (id: string, theme: string) => 
    api.put<PPT>(`/ppt/${id}/theme`, { theme }),
  downloadPdf: (id: string) => `${API_BASE_URL}/ppt/${id}/pdf`,
  downloadHtml: (id: string) => `${API_BASE_URL}/ppt/${id}/html`,
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken?: string; access_token?: string; user: any }>('/api/v1/auth/login', { email, password }),
  register: (email: string, password: string, username?: string) =>
    api.post<{ accessToken?: string; access_token?: string; user: any }>('/api/v1/auth/register', { email, password, username }),
  getCurrentUser: () => api.get('/api/v1/auth/profile'),
};

export default api;
