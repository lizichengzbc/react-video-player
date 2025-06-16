import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BaseEngine } from '../../engines/base/BaseEngine';
import { EngineFactory } from '../../engines/EngineFactory';
import { ErrorOverlay } from './ErrorOverlay';
import { VideoControls } from '../Controls/VideoControls';
import { 
  SocialActions, 
  SocialActionsCallbacks, 
  SocialActionsState, 
  SocialActionsConfig, 
  SocialActionsCustomUI 
} from '../Controls/SocialActions';
// 导入 Ant Design 组件
import { Button, Progress, Tooltip } from 'antd';
import { ReloadOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';

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
  onRetry?: () => void; // 重试回调
  showErrorOverlay?: boolean; // 是否显示错误覆盖层
  maxRetries?: number; // 最大重试次数配置
  
  // 社交功能配置
  socialActions?: {
    show?: boolean; // 是否显示社交功能
    state?: SocialActionsState; // 社交功能状态
    callbacks?: SocialActionsCallbacks; // 社交功能回调
    config?: SocialActionsConfig; // 社交功能配置
    customUI?: SocialActionsCustomUI; // 自定义UI
  };
  
  // 自定义UI配置
  customUI?: {
    retryButton?: React.ReactNode;
    dismissButton?: React.ReactNode;
    progressBar?: React.ReactNode;
    errorIcon?: React.ReactNode;
    loadingIndicator?: React.ReactNode;
    buttonPosition?: 'left' | 'center' | 'right';
    theme?: 'light' | 'dark';
    // 新增控件相关配置
    playButton?: React.ReactNode;
    pauseButton?: React.ReactNode;
    volumeButton?: React.ReactNode;
    fullscreenButton?: React.ReactNode;
  };
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
  showErrorOverlay = true,
  maxRetries = 3, // 默认值为3，现在可以从外部配置
  socialActions,
  customUI
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BaseEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 新增播放器状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
        setIsPlaying(false);
        onError?.(error);
      });

      engine.on('play', () => {
        setError(null); // 播放成功时清除错误
        setIsPlaying(true);
        onPlay?.();
      });
      
      engine.on('pause', () => {
        setIsPlaying(false);
        onPause?.();
      });
      
      engine.on('ended', () => {
        setIsPlaying(false);
        onEnded?.();
      });
      
      engine.on('timeupdate', (time: number) => {
        setCurrentTime(time);
        onTimeUpdate?.(time);
      });
      
      engine.on('loadedmetadata', () => {
        if (videoRef.current) {
          setDuration(videoRef.current.duration);
        }
      });
      
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
      setIsPlaying(false);
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
      setError(`重试次数已达上限(${maxRetries}次)，请稍后再试`);
    }
  }, [retryCount, maxRetries, onRetry, initializeEngine]);

  // 关闭错误提示
  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  // 播放/暂停控制
  const handlePlay = useCallback(() => {
    if (engineRef.current && !isPlaying) {
      engineRef.current.play().catch(error => {
        console.error('Play failed:', error);
      });
    }
  }, [isPlaying]);

  const handlePause = useCallback(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.pause();
    }
  }, [isPlaying]);

  // 跳转控制
  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // 音量控制
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (engineRef.current) {
      engineRef.current.setVolume(newVolume);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  // 静音切换
  const handleMuteToggle = useCallback(() => {
    if (engineRef.current && videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // 全屏控制
  const handleFullscreenToggle = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('全屏模式错误:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('退出全屏模式错误:', err);
      });
    }
  }, []);

  // 重新加载
  const handleReload = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      initializeEngine().then(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
        }
      });
    }
  }, [initializeEngine]);

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

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor: '#000',
    overflow: 'hidden', // 防止内容溢出
    borderRadius: '8px', // 添加圆角
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' // 添加阴影效果
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
    gap: '12px',
    zIndex: 999
  };
  
  // 添加播放状态信息显示
  const statusStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: 998,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  return (
    <div ref={containerRef} style={containerStyle} className={className} role="application">
      <video
        ref={videoRef}
        poster={poster}
        muted={isMuted}
        loop={loop}
        controls={false} // 禁用原生控件，使用自定义控件
        style={videoStyle}
        playsInline
        webkit-playsinline="true"
      />
      
      {/* 自定义控件 */}
      {controls && !error && !isLoading && (
        <VideoControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={isMuted}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onFullscreenToggle={handleFullscreenToggle}
          onReload={handleReload}
          customUI={customUI}
        />
      )}
      
      {/* 社交功能组件 */}
      {socialActions?.show && !error && !isLoading && (
        <SocialActions
          state={socialActions.state}
          callbacks={socialActions.callbacks}
          config={socialActions.config}
          customUI={socialActions.customUI}
        />
      )}
      
      {/* 加载状态 - 改进加载动画 */}
      {isLoading && !error && (
        <div style={loadingStyle}>
          {customUI?.loadingIndicator || (
            <>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                borderTop: '3px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
              }} />
              <span>加载中...</span>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </>
          )}
        </div>
      )}
      
      {/* 重试状态信息 */}
      {retryCount > 0 && !error && (
        <div style={statusStyle}>
          <span>🔄</span>
          <span>已重试 {retryCount}/{maxRetries} 次</span>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && showErrorOverlay && (
        <ErrorOverlay
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
          retryCount={retryCount}
          maxRetries={maxRetries}
          customUI={customUI}
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
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(255, 0, 0, 0.3)'
        }}>
          {customUI?.errorIcon || <WarningOutlined style={{ fontSize: '18px' }} />}
          <span>{error}</span>
          <Button 
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            style={{
              marginLeft: 'auto',
              color: 'white',
            }}
            disabled={retryCount >= maxRetries}
          >
            重试 ({retryCount}/{maxRetries})
          </Button>
        </div>
      )}
    </div>
  );
};
