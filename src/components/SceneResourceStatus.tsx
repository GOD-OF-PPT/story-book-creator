/**
 * 场景资源状态组件
 */

import React from 'react';
import { UploadProgress } from './UploadProgress';
import './SceneResourceStatus.css';

export type ResourceStatus = 'pending' | 'generating' | 'uploading' | 'completed' | 'failed';

export interface SceneResourceStatusProps {
  type: 'image' | 'audio';
  status: ResourceStatus;
  uploadPercent?: number;
  onRetry?: () => void;
}

export const SceneResourceStatus: React.FC<SceneResourceStatusProps> = ({
  type,
  status,
  uploadPercent = 0,
  onRetry,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'generating':
        return '🔄';
      case 'uploading':
        return '📤';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return '等待生成';
      case 'generating':
        return '生成中...';
      case 'uploading':
        return '上传中...';
      case 'completed':
        return '完成';
      case 'failed':
        return '失败';
    }
  };

  const resourceName = type === 'image' ? '图片' : '音频';

  return (
    <div className="scene-resource-status">
      <div className="status-header">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">
          {resourceName}: {getStatusText()}
        </span>
      </div>

      {status === 'uploading' && (
        <UploadProgress percent={uploadPercent} status="uploading" />
      )}

      {status === 'failed' && onRetry && (
        <button className="retry-button" onClick={onRetry}>
          重新上传
        </button>
      )}
    </div>
  );
};
