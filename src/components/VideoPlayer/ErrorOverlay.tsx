import React from 'react';
import { Button, Progress, Space, Typography } from 'antd';
import { ReloadOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export interface ErrorOverlayProps {
  error: string;
  onRetry: () => void;
  onDismiss?: () => void;
  className?: string;
  retryCount?: number;
  maxRetries?: number;
  // 新增：自定义UI配置
  customUI?: {
    retryButton?: React.ReactNode;
    dismissButton?: React.ReactNode;
    progressBar?: React.ReactNode;
    errorIcon?: React.ReactNode;
    buttonPosition?: 'left' | 'center' | 'right';
    theme?: 'light' | 'dark';
  };
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  error,
  onRetry,
  onDismiss,
  className,
  retryCount = 0,
  maxRetries = 3,
  customUI
}) => {
  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)', // 添加模糊效果
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
    maxWidth: '450px',
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '52px',
    marginBottom: '20px',
    color: '#ff4444',
    textShadow: '0 0 10px rgba(255, 68, 68, 0.5)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#ffffff'
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '24px',
    color: '#cccccc',
    wordBreak: 'break-word'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const retryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#2563eb', // 更现代的蓝色
    color: 'white',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
  };

  const dismissButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#cccccc',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  // 处理按钮悬停效果
  const handleRetryMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#1d4ed8';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleRetryMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#2563eb';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  const handleDismissMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleDismissMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    e.currentTarget.style.transform = 'translateY(0)';
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

  // 计算重试进度
  const retryProgress = (retryCount / maxRetries) * 100;
  const errorInfo = getErrorInfo(error);
  
  // 根据自定义配置确定按钮位置的样式
  const getButtonContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
    };
    
    switch (customUI?.buttonPosition) {
      case 'left':
        return { ...baseStyle, justifyContent: 'flex-start' };
      case 'right':
        return { ...baseStyle, justifyContent: 'flex-end' };
      case 'center':
      default:
        return { ...baseStyle, justifyContent: 'center' };
    }
  };

  return (
    <div style={overlayStyle} className={className}>
      <div style={contentStyle}>
        {/* 错误图标 */}
        <div style={iconStyle}>
          {customUI?.errorIcon || <WarningOutlined style={{ fontSize: '52px', color: '#ff4444' }} />}
        </div>
        
        {/* 错误标题 */}
        <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
          {errorInfo.title}
        </Title>
        
        {/* 错误消息 */}
        <Paragraph style={{ color: '#cccccc', marginBottom: '24px' }}>
          {errorInfo.message}
        </Paragraph>
        
        {/* 重试进度条 */}
        {retryCount > 0 && (
          <div style={{ marginBottom: '20px', width: '100%' }}>
            {customUI?.progressBar || (
              <Progress 
                percent={retryProgress} 
                status={retryCount >= maxRetries ? 'exception' : 'active'}
                showInfo={false}
                strokeColor={retryCount >= maxRetries ? '#ff4444' : '#2563eb'}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
            )}
          </div>
        )}
        
        {/* 重试计数 */}
        {retryCount > 0 && (
          <Text style={{ color: '#999', marginBottom: '20px', display: 'block' }}>
            已重试 {retryCount}/{maxRetries} 次
            {retryCount >= maxRetries && ' (已达上限)'}
          </Text>
        )}
        
        {/* 操作按钮 */}
        <div style={getButtonContainerStyle()}>
          {customUI?.retryButton || (
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={onRetry}
              disabled={retryCount >= maxRetries}
              size="large"
            >
              重新加载
            </Button>
          )}
          
          {onDismiss && (customUI?.dismissButton || (
            <Button 
              icon={<CloseOutlined />}
              onClick={onDismiss}
              size="large"
              ghost
            >
              关闭
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};