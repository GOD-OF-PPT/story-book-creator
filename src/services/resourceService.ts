/**
 * 资源生成服务（无轮询版）
 * 后端同步返回生成结果，R2上传在后台进行
 */

import { bookApi } from './api';

export interface ResourceGenerationProgress {
  stage: 'generating' | 'completed';
  sceneNumber: number;
  resourceType: 'image' | 'audio';
  progress?: number; // 0-100 百分比
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
  
  // 启动异步生成任务
  onProgress?.({ stage: 'generating', sceneNumber: 0, resourceType: 'image' });
  const response = await bookApi.generate(bookId, voiceId, imageModel, generateAudio);
  
  console.log('[资源服务] 生成任务已启动:', response.data.message);
  
  // 轮询检查生成状态
  let attempts = 0;
  const maxAttempts = 120; // 最多等待10分钟 (120 * 5秒)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
    attempts++;
    
    try {
      const { data: book } = await bookApi.findOne(bookId);
      
      // 检查生成状态
      if (book.status === 'completed') {
        console.log('[资源服务] 生成完成');
        onProgress?.({ stage: 'completed', sceneNumber: 0, resourceType: 'image' });
        return;
      } else if (book.status === 'failed') {
        throw new Error('生成失败');
      } else if (book.status === 'generating') {
        // 计算进度
        const totalScenes = book.scenes?.length || 0;
        const completedScenes = book.scenes?.filter(scene => 
          scene.imageStatus === 'completed' && (!generateAudio || scene.audioStatus === 'completed')
        ).length || 0;
        
        onProgress?.({ 
          stage: 'generating', 
          sceneNumber: completedScenes, 
          resourceType: 'image',
          progress: totalScenes > 0 ? (completedScenes / totalScenes) * 100 : 0
        });
      }
    } catch (error) {
      console.error('[资源服务] 检查状态失败:', error);
    }
  }
  
  throw new Error('生成超时，请稍后查看结果');
}
