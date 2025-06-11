import React from 'react';

export interface ErrorOverlayProps {
  error: string;
  onRetry: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  error,
  onRetry,
  onDismiss,
  className
}) => {
  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    padding: '20px',
    boxSizing: 'border-box',
    zIndex: 1000
  };

  const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#ff4444'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#ffffff'
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '24px',
    color: '#cccccc',
    wordBreak: 'break-word'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '100px'
  };

  const retryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const dismissButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#cccccc',
    border: '1px solid #666'
  };

  // 处理按钮悬停效果
  const handleRetryMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#0056b3';
  };

  const handleRetryMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#007bff';
  };

  const handleDismissMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  };

  const handleDismissMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  // 获取错误类型和友好提示
  const getErrorInfo = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return {
        title: '网络连接错误',
        message: '无法加载视频，请检查网络连接后重试'
      };
    }
    
    if (lowerError.includes('cors') || lowerError.includes('cross-origin')) {
      return {
        title: '跨域访问错误',
        message: '视频资源不允许跨域访问，请联系管理员'
      };
    }
    
    if (lowerError.includes('format') || lowerError.includes('codec')) {
      return {
        title: '格式不支持',
        message: '当前浏览器不支持此视频格式'
      };
    }
    
    if (lowerError.includes('hls') || lowerError.includes('m3u8')) {
      return {
        title: 'HLS播放错误',
        message: 'HLS视频流播放失败，请重试'
      };
    }
    
    if (lowerError.includes('dash') || lowerError.includes('mpd')) {
      return {
        title: 'DASH播放错误',
        message: 'DASH视频流播放失败，请重试'
      };
    }
    
    return {
      title: '播放错误',
      message: errorMessage
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div style={overlayStyle} className={className}>
      <div style={contentStyle}>
        {/* 错误图标 */}
        <div style={iconStyle}>⚠️</div>
        
        {/* 错误标题 */}
        <div style={titleStyle}>{errorInfo.title}</div>
        
        {/* 错误消息 */}
        <div style={messageStyle}>{errorInfo.message}</div>
        
        {/* 操作按钮 */}
        <div style={buttonContainerStyle}>
          <button
            style={retryButtonStyle}
            onClick={onRetry}
            onMouseEnter={handleRetryMouseEnter}
            onMouseLeave={handleRetryMouseLeave}
            aria-label="重新加载视频"
          >
            🔄 重新加载
          </button>
          
          {onDismiss && (
            <button
              style={dismissButtonStyle}
              onClick={onDismiss}
              onMouseEnter={handleDismissMouseEnter}
              onMouseLeave={handleDismissMouseLeave}
              aria-label="关闭错误提示"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
};