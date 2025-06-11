import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BaseEngine } from '../../engines/base/BaseEngine';
import { EngineFactory } from '../../engines/EngineFactory';
import { ErrorOverlay } from './ErrorOverlay';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onRetry?: () => void; // 新增重试回调
  showErrorOverlay?: boolean; // 是否显示错误覆盖层
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  width = '100%',
  height = 'auto',
  className,
  onPlay,
  onPause,
  onEnded,
  onError,
  onTimeUpdate,
  onRetry,
  showErrorOverlay = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<BaseEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3; // 最大重试次数

  // 初始化引擎
  const initializeEngine = useCallback(async () => {
    if (!videoRef.current || !src) return;

    setIsLoading(true);
    setError(null);

    try {
      // 销毁旧引擎
      if (engineRef.current) {
        engineRef.current.destroy();
      }

      // 创建新引擎
      const engine = EngineFactory.createEngine(src, videoRef.current);
      engineRef.current = engine;

      // 绑定事件
      engine.on('error', (error: Error) => {
        console.error('Video playback error:', error);
        setError(error.message);
        setIsLoading(false);
        onError?.(error);
      });

      engine.on('play', () => {
        setError(null); // 播放成功时清除错误
        onPlay?.();
      });
      
      engine.on('pause', () => onPause?.());
      engine.on('ended', () => onEnded?.());
      engine.on('timeupdate', (time: number) => onTimeUpdate?.(time));
      
      engine.on('canplay', () => {
        setIsLoading(false);
        setRetryCount(0); // 重置重试计数
        if (autoplay) {
          engine.play().catch((playError) => {
            console.error('Auto-play failed:', playError);
            // 自动播放失败通常不是严重错误，不显示错误界面
          });
        }
      });

      engine.on('loadstart', () => {
        setIsLoading(true);
        setError(null);
      });

      // 加载视频
      await engine.load(src);
    } catch (error) {
      console.error('Engine initialization error:', error);
      setError((error as Error).message);
      setIsLoading(false);
    }
  }, [src, autoplay, onPlay, onPause, onEnded, onError, onTimeUpdate]);

  // 重试功能
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError(null);
      onRetry?.(); // 调用外部重试回调
      initializeEngine();
    } else {
      setError('重试次数已达上限，请稍后再试');
    }
  }, [retryCount, maxRetries, onRetry, initializeEngine]);

  // 关闭错误提示
  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [initializeEngine]);

  // 当src改变时重置重试计数
  useEffect(() => {
    setRetryCount(0);
    setError(null);
  }, [src]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor: '#000',
    overflow: 'hidden' // 防止内容溢出
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  };

  const loadingStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 999
  };

  return (
    <div style={containerStyle} className={className}>
      <video
        ref={videoRef}
        poster={poster}
        muted={muted}
        loop={loop}
        controls={controls && !error} // 有错误时隐藏控制条
        style={videoStyle}
        playsInline
        webkit-playsinline="true"
      />
      
      {/* 加载状态 */}
      {isLoading && !error && (
        <div style={loadingStyle}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ffffff30',
            borderTop: '2px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>加载中...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && showErrorOverlay && (
        <ErrorOverlay
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}
      
      {/* 简单错误提示（当不显示覆盖层时） */}
      {error && !showErrorOverlay && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 999
        }}>
          {error}
        </div>
      )}
    </div>
  );
};