import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BaseEngine } from '../../engines/base/BaseEngine';
import { EngineFactory } from '../../engines/EngineFactory';
import { ErrorOverlay } from './ErrorOverlay';
import { VideoControls } from '../Controls/VideoControls';
import { Button } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { 
  SocialActions, 
  SocialActionsCallbacks, 
  SocialActionsState, 
  SocialActionsConfig, 
  SocialActionsCustomUI 
} from '../Controls/SocialActions';
import { VideoPlayerState, VideoPlayerControls } from '../../types';

// 视频播放器属性接口
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
  onRetry?: () => void;
  showErrorOverlay?: boolean;
  maxRetries?: number;
  customUI?: {
    retryButton?: React.ReactNode;
    dismissButton?: React.ReactNode;
    progressBar?: React.ReactNode;
    errorIcon?: React.ReactNode;
    loadingIndicator?: React.ReactNode;
    buttonPosition?: 'left' | 'center' | 'right';
    theme?: 'light' | 'dark';
    playButton?: React.ReactNode;
    pauseButton?: React.ReactNode;
    volumeButton?: React.ReactNode;
    fullscreenButton?: React.ReactNode;
  };
  // 社交功能配置
  socialActions?: {
    show?: boolean;
    state?: SocialActionsState;
    callbacks?: SocialActionsCallbacks;
    config?: SocialActionsConfig;
    customUI?: SocialActionsCustomUI;
  };
  // 新增：允许在视频容器内渲染额外内容
  children?: React.ReactNode;
}

// 类型定义已移至 src/types/index.ts

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
  maxRetries = 3,
  customUI,
  socialActions,
  children
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BaseEngine | null>(null);
  
  // 播放器状态
  const [state, setState] = useState<VideoPlayerState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: muted ? 0 : 1,
    isMuted: muted,
    isFullscreen: false
  });

  // 状态更新辅助函数
  const updateState = useCallback((updates: Partial<VideoPlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 初始化引擎
  const initializeEngine = useCallback(async () => {
    if (!videoRef.current || !src) return;

    updateState({ isLoading: true, error: null });

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
        updateState({ 
          error: error.message, 
          isLoading: false, 
          isPlaying: false 
        });
        onError?.(error);
      });

      engine.on('play', () => {
        updateState({ error: null, isPlaying: true });
        onPlay?.();
      });
      
      engine.on('pause', () => {
        updateState({ isPlaying: false });
        onPause?.();
      });
      
      engine.on('ended', () => {
        updateState({ isPlaying: false });
        onEnded?.();
      });
      
      engine.on('timeupdate', (time: number) => {
        updateState({ currentTime: time });
        onTimeUpdate?.(time);
      });
      
      engine.on('loadedmetadata', () => {
        if (videoRef.current) {
          updateState({ duration: videoRef.current.duration });
        }
      });
      
      engine.on('canplay', () => {
        updateState({ isLoading: false, retryCount: 0 });
        if (autoplay) {
          engine.play().catch((playError) => {
            console.error('Auto-play failed:', playError);
          });
        }
      });

      engine.on('loadstart', () => {
        updateState({ isLoading: true, error: null });
      });

      // 加载视频
      await engine.load(src);
    } catch (error) {
      console.error('Engine initialization error:', error);
      updateState({ 
        error: (error as Error).message, 
        isLoading: false, 
        isPlaying: false 
      });
    }
  }, [src, autoplay, onPlay, onPause, onEnded, onError, onTimeUpdate, updateState]);

  // 播放器控制方法
  const controls_methods: VideoPlayerControls = {
    play: useCallback(() => {
      if (engineRef.current && !state.isPlaying) {
        engineRef.current.play().catch(error => {
          console.error('Play failed:', error);
        });
      }
    }, [state.isPlaying]),

    pause: useCallback(() => {
      if (engineRef.current && state.isPlaying) {
        engineRef.current.pause();
      }
    }, [state.isPlaying]),

    seek: useCallback((time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    }, []),

    setVolume: useCallback((newVolume: number) => {
      if (engineRef.current) {
        engineRef.current.setVolume(newVolume);
        updateState({ 
          volume: newVolume, 
          isMuted: newVolume === 0 
        });
      }
    }, [updateState]),

    toggleMute: useCallback(() => {
      if (engineRef.current && videoRef.current) {
        const newMuted = !state.isMuted;
        videoRef.current.muted = newMuted;
        updateState({ isMuted: newMuted });
      }
    }, [state.isMuted, updateState]),

    toggleFullscreen: useCallback(() => {
      if (!containerRef.current) return;
      
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().then(() => {
          updateState({ isFullscreen: true });
        }).catch(err => {
          console.error('全屏模式错误:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          updateState({ isFullscreen: false });
        }).catch(err => {
          console.error('退出全屏模式错误:', err);
        });
      }
    }, [updateState]),

    reload: useCallback(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        initializeEngine().then(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = currentTime;
          }
        });
      }
    }, [initializeEngine]),

    retry: useCallback(() => {
      if (state.retryCount < maxRetries) {
        updateState({ 
          retryCount: state.retryCount + 1, 
          error: null 
        });
        onRetry?.();
        initializeEngine();
      } else {
        updateState({ 
          error: `重试次数已达上限(${maxRetries}次)，请稍后再试` 
        });
      }
    }, [state.retryCount, maxRetries, onRetry, initializeEngine, updateState])
  };

  // 关闭错误提示
  const handleDismissError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  useEffect(() => {
    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [initializeEngine]);

  // 当src改变时重置状态
  useEffect(() => {
    updateState({ retryCount: 0, error: null });
  }, [src, updateState]);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      updateState({ isFullscreen: !!document.fullscreenElement });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [updateState]);

  // 样式定义
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
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
    <div 
      ref={containerRef} 
      style={containerStyle} 
      className={className} 
      role="application"
    >
      <video
        ref={videoRef}
        poster={poster}
        muted={state.isMuted}
        loop={loop}
        controls={false}
        style={videoStyle}
        playsInline
        webkit-playsinline="true"
      />
      
      {/* 自定义控件 */}
      {controls && !state.error && !state.isLoading && (
        <VideoControls
          isPlaying={state.isPlaying}
          currentTime={state.currentTime}
          duration={state.duration}
          volume={state.volume}
          muted={state.isMuted}
          onPlay={controls_methods.play}
          onPause={controls_methods.pause}
          onSeek={controls_methods.seek}
          onVolumeChange={controls_methods.setVolume}
          onMuteToggle={controls_methods.toggleMute}
          onFullscreenToggle={controls_methods.toggleFullscreen}
          onReload={controls_methods.reload}
          customUI={customUI}
        />
      )}
      
      {/* 社交功能组件 */}
      {socialActions?.show && !state.error && !state.isLoading && (
        <SocialActions
          state={socialActions.state}
          callbacks={socialActions.callbacks}
          config={socialActions.config}
          customUI={socialActions.customUI}
        />
      )}
      
      {/* 加载状态 */}
      {state.isLoading && !state.error && (
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
      {state.retryCount > 0 && !state.error && (
        <div style={statusStyle}>
          <span>🔄</span>
          <span>已重试 {state.retryCount}/{maxRetries} 次</span>
        </div>
      )}
      
      {/* 错误状态 */}
      {state.error && showErrorOverlay && (
        <ErrorOverlay
          error={state.error}
          onRetry={controls_methods.retry}
          onDismiss={handleDismissError}
          retryCount={state.retryCount}
          maxRetries={maxRetries}
          customUI={customUI}
        />
      )}
      
      {/* 简单错误提示 */}
      {state.error && !showErrorOverlay && (
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
          <span>{state.error}</span>
          <Button 
            type="text"
            icon={<ReloadOutlined />}
            onClick={controls_methods.retry}
            style={{
              marginLeft: 'auto',
              color: 'white',
            }}
            disabled={state.retryCount >= maxRetries}
          >
            重试 ({state.retryCount}/{maxRetries})
          </Button>
        </div>
      )}
      
      {/* 允许渲染额外的子组件 */}
      {children}
    </div>
  );
};

// 导出状态和控制接口供其他组件使用
// export type { VideoPlayerState, VideoPlayerControls };