import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { API_BASE_URL } from './api';

export interface ExportOptions {
  screenshots: boolean;
  pdf: boolean;
  textScript: boolean; // 新增文案导出选项
}

export class ExportService {
  /**
   * 生成单个场景的截图
   */
  static async generateSceneScreenshot(
    imageUrl: string, 
    content: string, 
    sceneNumber: number
  ): Promise<Blob> {
    // 创建临时DOM元素用于截图
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 800px;
      background: white;
      padding: 30px;
      font-family: 'Microsoft YaHei', sans-serif;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    `;
    
    // 创建图片元素
    const img = document.createElement('img');
    img.style.cssText = `
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    `;
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    // 创建文本元素
    const text = document.createElement('div');
    text.style.cssText = `
      font-size: 18px;
      line-height: 1.6;
      color: #333;
      text-align: center;
      padding: 0 10px;
      margin-bottom: 0;
    `;
    text.textContent = content;
    
    // 添加场景编号
    const sceneLabel = document.createElement('div');
    sceneLabel.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 14px;
      font-weight: 600;
    `;
    sceneLabel.textContent = `场景 ${sceneNumber}`;
    
    container.appendChild(img);
    container.appendChild(text);
    container.appendChild(sceneLabel);
    document.body.appendChild(container);
    
    try {
      // 等待图片加载
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        // 如果图片已经加载完成
        if (img.complete) resolve(null);
      });
      
      // 计算实际内容高度
      const actualHeight = img.offsetHeight + text.offsetHeight + 80; // 80px为padding和间距
      container.style.height = actualHeight + 'px';
      
      // 生成截图
      const canvas = await html2canvas(container, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: actualHeight,
        windowWidth: 800,
        windowHeight: actualHeight,
      });
      
      // 转换为Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });
      
      return blob;
    } finally {
      // 清理临时DOM
      document.body.removeChild(container);
    }
  }
  
  /**
   * 批量生成场景截图并打包下载
   */
  static async exportScreenshots(
    scenes: Array<{
      sceneNumber: number;
      content: string;
      imageFilename?: string;
      imageUrl?: string;
    }>,
    bookTitle: string = '绘本'
  ): Promise<void> {
    const zip = new JSZip();
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      if (!scene.imageUrl && !scene.imageFilename) {
        console.warn(`场景 ${scene.sceneNumber} 没有图片，跳过`);
        continue;
      }
      
      try {
        const imageUrl = scene.imageUrl || `${API_BASE_URL}/uploads/images/${scene.imageFilename}`;
        const blob = await this.generateSceneScreenshot(
          imageUrl,
          scene.content,
          scene.sceneNumber
        );
        
        // 添加到ZIP
        zip.file(`${bookTitle}-场景${scene.sceneNumber}.png`, blob);
      } catch (error) {
        console.error(`场景 ${scene.sceneNumber} 截图生成失败:`, error);
      }
    }
    
    // 生成并下载ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    saveAs(content, `${bookTitle}-场景截图-${timestamp}.zip`);
  }

  /**
   * 生成绘本文案文本
   */
  static generateTextScript(
    scenes: Array<{
      sceneNumber: number;
      content: string;
    }>,
    bookTitle: string
  ): string {
    let script = `${bookTitle}\n`;
    script += '='.repeat(bookTitle.length * 2) + '\n\n';
    
    scenes.forEach(scene => {
      script += `场景 ${scene.sceneNumber}\n`;
      script += '-'.repeat(10) + '\n';
      script += scene.content + '\n\n';
    });
    
    script += `\n导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    return script;
  }

  /**
   * 导出文案为TXT文件
   */
  static exportTextScript(
    scenes: Array<{
      sceneNumber: number;
      content: string;
    }>,
    bookTitle: string
  ): void {
    const script = this.generateTextScript(scenes, bookTitle);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    saveAs(blob, `${bookTitle}-文案-${timestamp}.txt`);
  }
  
  /**
   * 导出绘本（根据选项）
   */
  static async exportBook(
    scenes: Array<{
      sceneNumber: number;
      content: string;
      imageFilename?: string;
      imageUrl?: string;
    }>,
    bookTitle: string,
    bookId: string,
    options: ExportOptions
  ): Promise<void> {
    if (options.textScript) {
      this.exportTextScript(scenes, bookTitle);
    }
    
    if (options.screenshots) {
      await this.exportScreenshots(scenes, bookTitle);
    }
    
    if (options.pdf) {
      // 调用后端 PDF 导出接口
      window.open(`${API_BASE_URL}/book/${bookId}/pdf`, '_blank');
    }
  }
}
