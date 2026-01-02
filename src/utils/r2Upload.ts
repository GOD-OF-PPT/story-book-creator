/**
 * R2上传工具函数
 * 统一的资源上传逻辑
 */

import { r2Api, bookApi, API_BASE_URL } from '../services/api';

export type ResourceType = 'image' | 'audio';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * 从URL下载并上传到R2
 */
async function uploadResourceToR2(
  sourceUrl: string,
  resourceType: ResourceType,
  sceneNumber: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  console.log(`[R2上传] 场景${sceneNumber} ${resourceType} - 开始处理`);
  console.log(`[R2上传] 源URL: ${sourceUrl}`);
  
  // 1. 获取R2上传签名
  const extension = resourceType === 'image' ? 'png' : 'mp3';
  const contentType = resourceType === 'image' ? 'image/png' : 'audio/mpeg';
  const key = `storybook/${resourceType}s/${resourceType}_${sceneNumber}_${Date.now()}.${extension}`;

  console.log(`[R2上传] 获取上传签名: ${key}`);
  const { uploadUrl, publicUrl } = await r2Api.getPresignedUrl(key, contentType);
  console.log(`[R2上传] 目标URL: ${publicUrl}`);

  // 2. 从源URL下载（通过后端代理避免CORS）
  console.log(`[R2上传] 开始下载源文件（通过代理）...`);
  const proxyUrl = `${API_BASE_URL}/r2/proxy?url=${encodeURIComponent(sourceUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`下载失败: ${response.statusText}`);
  }
  const blob = await response.blob();
  console.log(`[R2上传] 下载完成，大小: ${(blob.size / 1024).toFixed(2)}KB`);

  // 3. 上传到R2
  console.log(`[R2上传] 开始上传到R2...`);
  await uploadWithProgress(uploadUrl, blob, contentType, onProgress);
  console.log(`[R2上传] 上传完成: ${publicUrl}`);

  return publicUrl;
}

/**
 * 带进度的上传
 */
function uploadWithProgress(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`上传失败: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('上传失败')));
    xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(blob);
  });
}

/**
 * 前端自动重试
 */
async function uploadWithRetry(
  sourceUrl: string,
  resourceType: ResourceType,
  sceneNumber: number,
  onProgress?: (progress: UploadProgress) => void,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[R2上传] 尝试 ${i + 1}/${maxRetries}`);
      return await uploadResourceToR2(sourceUrl, resourceType, sceneNumber, onProgress);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = 3000 * (i + 1);
      console.log(`[R2上传] 失败，${delay}ms后重试...`, error);
      await sleep(delay);
    }
  }
  throw new Error('重试次数已用完');
}

/**
 * 混合失败处理策略（三层保障）
 */
export async function uploadResourceWithFallback(
  bookId: string,
  sceneNumber: number,
  sourceUrl: string,
  resourceType: ResourceType,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // 第一层：前端自动重试3次
    console.log(`[${resourceType}上传] 开始前端上传，场景${sceneNumber}`);
    const r2Url = await uploadWithRetry(sourceUrl, resourceType, sceneNumber, onProgress, 3);

    // 成功后通知后端更新URL
    await bookApi.updateSceneResource(bookId, sceneNumber, resourceType, r2Url);

    console.log(`[${resourceType}上传] 前端上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.log(`[${resourceType}上传] 前端上传失败，降级到后端上传...`, error);

    try {
      // 第二层：后端补偿上传
      const response = await bookApi.fallbackUpload(bookId, sceneNumber, resourceType, sourceUrl);
      const r2Url = response.data.r2Url;

      console.log(`[${resourceType}上传] 后端补偿上传成功: ${r2Url}`);
      return r2Url;
    } catch (fallbackError) {
      console.error(`[${resourceType}上传] 后端上传也失败，需要用户手动重试`, fallbackError);

      // 第三层：抛出错误，由UI层显示重试按钮
      throw new Error(`上传失败: ${fallbackError instanceof Error ? fallbackError.message : '未知错误'}`);
    }
  }
}

/**
 * 工具函数：延迟
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
