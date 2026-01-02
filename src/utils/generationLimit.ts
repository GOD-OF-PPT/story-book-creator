import { configApi, membershipApi, generationApi } from '../services/api';
import { getDeviceFingerprint } from './fingerprint';

const STORAGE_KEY = 'storybook_generation_limit';

export interface GenerationLimit {
  preferences: {
    language: 'zh' | 'en';
  };
  anonymous: {
    count: number;
    lastGeneratedAt?: string;
  };
  users: {
    [userId: string]: {
      date: string;
      createCount: number;
      randomCount: number;
      isMember?: boolean;
    };
  };
}

export function getGenerationLimit(): GenerationLimit {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      preferences: { language: 'zh' },
      anonymous: { count: 0 },
      users: {}
    };
  }
  return JSON.parse(stored);
}

export function saveGenerationLimit(limit: GenerationLimit): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limit));
}

export function saveLanguagePreference(language: 'zh' | 'en'): void {
  const limit = getGenerationLimit();
  limit.preferences.language = language;
  saveGenerationLimit(limit);
}

export function getLanguagePreference(): 'zh' | 'en' {
  const limit = getGenerationLimit();
  return limit.preferences.language;
}

export async function canGenerateAnonymous(): Promise<{
  canGenerate: boolean;
  remaining: number;
  limit: number;
}> {
  const limit = getGenerationLimit();
  const config = await configApi.getGenerationLimits();
  const anonymousLimit = config.data.anonymousLimit;
  
  const remaining = Math.max(0, anonymousLimit - limit.anonymous.count);
  
  return {
    canGenerate: limit.anonymous.count < anonymousLimit,
    remaining,
    limit: anonymousLimit
  };
}

export function recordAnonymousGeneration(): void {
  const limit = getGenerationLimit();
  limit.anonymous.count++;
  limit.anonymous.lastGeneratedAt = new Date().toISOString();
  saveGenerationLimit(limit);
}

export async function canGenerateUser(userId: string, type: 'create' | 'random'): Promise<{
  canGenerate: boolean;
  remaining: number;
  limit: number;
  isMember: boolean;
}> {
  const limit = getGenerationLimit();
  const config = await configApi.getGenerationLimits();
  const today = new Date().toISOString().split('T')[0];
  
  // 检查会员状态
  let isMember = false;
  try {
    const membershipStatus = await membershipApi.getMembershipStatus();
    isMember = membershipStatus.data.isMember;
  } catch (error) {
    console.error('获取会员状态失败:', error);
  }
  
  // 根据会员状态选择限制
  const dailyLimit = isMember ? config.data.memberDailyLimit : config.data.userDailyLimit;
  
  const userLimit = limit.users[userId];
  
  if (!userLimit || userLimit.date !== today) {
    return { 
      canGenerate: true, 
      remaining: dailyLimit,
      limit: dailyLimit,
      isMember
    };
  }
  
  const count = type === 'create' ? userLimit.createCount : userLimit.randomCount;
  const remaining = Math.max(0, dailyLimit - count);
  
  return {
    canGenerate: count < dailyLimit,
    remaining,
    limit: dailyLimit,
    isMember
  };
}

export function recordUserGeneration(userId: string, type: 'create' | 'random', isMember: boolean = false): void {
  const limit = getGenerationLimit();
  const today = new Date().toISOString().split('T')[0];
  
  if (!limit.users[userId] || limit.users[userId].date !== today) {
    limit.users[userId] = {
      date: today,
      createCount: 0,
      randomCount: 0,
      isMember
    };
  }
  
  if (type === 'create') {
    limit.users[userId].createCount++;
  } else {
    limit.users[userId].randomCount++;
  }
  
  limit.users[userId].isMember = isMember;
  
  saveGenerationLimit(limit);
}

export function cleanupExpiredData(): void {
  const limit = getGenerationLimit();
  const today = new Date().toISOString().split('T')[0];
  
  Object.keys(limit.users).forEach(userId => {
    if (limit.users[userId].date !== today) {
      delete limit.users[userId];
    }
  });
  
  saveGenerationLimit(limit);
}

// 后端验证函数（带设备指纹）
export async function checkGenerationLimitWithBackend(type: 'create' | 'random' | 'all'): Promise<{
  canGenerate: boolean;
  createRemaining: number;
  randomRemaining: number;
  limit: number;
  isMember: boolean;
  pending?: boolean;
}> {
  try {
    console.log('[checkGenerationLimitWithBackend] 开始请求:', type);
    const fingerprint = await getDeviceFingerprint();
    console.log('[checkGenerationLimitWithBackend] 指纹:', fingerprint);
    
    const response = await generationApi.checkLimit(type, fingerprint);
    console.log('[checkGenerationLimitWithBackend] 响应成功:', response.data);
    
    return {
      canGenerate: response.data.canGenerate,
      createRemaining: response.data.createRemaining,
      randomRemaining: response.data.randomRemaining,
      limit: response.data.limit,
      isMember: response.data.isMember,
      pending: response.data.pending
    };
  } catch (error: any) {
    console.error('后端验证失败，降级使用localStorage:', error);
    console.error('错误详情:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      data: error?.response?.data
    });
    // 降级策略：使用localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const fallbackType: 'create' | 'random' = type === 'all' ? 'create' : type;
    
    if (user) {
      const result = await canGenerateUser(user.id, fallbackType);
      return {
        canGenerate: result.canGenerate,
        createRemaining: result.remaining,
        randomRemaining: result.remaining,
        limit: result.limit,
        isMember: result.isMember
      };
    } else {
      const result = await canGenerateAnonymous();
      return {
        canGenerate: result.canGenerate,
        createRemaining: result.remaining,
        randomRemaining: result.remaining,
        limit: result.limit,
        isMember: false
      };
    }
  }
}

export async function recordGenerationWithBackend(type: 'create' | 'random'): Promise<void> {
  try {
    const fingerprint = await getDeviceFingerprint();
    await generationApi.record(type, fingerprint);
  } catch (error) {
    console.error('后端记录失败:', error);
  }
}
