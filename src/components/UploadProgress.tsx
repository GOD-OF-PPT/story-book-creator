/**
 * 上传进度条组件
 */

import React from 'react';
import './UploadProgress.css';

export interface UploadProgressProps {
  percent: number;
  status?: 'uploading' | 'success' | 'error';
  showPercent?: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  percent,
  status = 'uploading',
  showPercent = true,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      default:
        return '#1890ff';
    }
  };

  return (
    <div className="upload-progress">
      <div className="upload-progress-bar">
        <div
          className="upload-progress-fill"
          style={{
            width: `${percent}%`,
            backgroundColor: getStatusColor(),
          }}
        />
      </div>
      {showPercent && (
        <span className="upload-progress-text">{Math.round(percent)}%</span>
      )}
    </div>
  );
};
