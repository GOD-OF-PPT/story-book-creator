/**
 * 资源生成服务（无轮询版）
 * 后端同步返回生成结果，R2上传在后台进行
 */

import { bookApi } from './api';

export interface ResourceGenerationProgress {
  stage: 'generating';
  sceneNumber: number;
  resourceType: 'image' | 'audio';
}

export type ProgressCallback = (progress: ResourceGenerationProgress) => void;

/**
 * 生成资源（同步等待）
 */
export async function generateAndUploadResources(
  bookId: string,
  voiceId?: string,
  imageModel?: 'doubao',
  generateAudio: boolean = true,
  onProgress?: ProgressCallback
): Promise<void> {
  console.log('[资源服务] 开始生成资源', { bookId, voiceId, imageModel, generateAudio });
  
  // 调用后端生成，同步等待完成
  onProgress?.({ stage: 'generating', sceneNumber: 0, resourceType: 'image' });
  await bookApi.generate(bookId, voiceId, imageModel, generateAudio);
  
  console.log('[资源服务] 生成完成');
}
