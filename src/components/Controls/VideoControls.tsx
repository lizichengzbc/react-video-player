import React, { useState, useEffect, useRef, cloneElement, isValidElement } from 'react';
import { Button, Slider, Tooltip, Row, Col } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  FullscreenOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

export interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onReload: () => void;
  customUI?: {
    playButton?: React.ReactNode;
    pauseButton?: React.ReactNode;
    volumeButton?: React.ReactNode;
    fullscreenButton?: React.ReactNode;
    progressBar?: React.ReactNode;
    theme?: 'light' | 'dark';
  };
}

// 添加一个辅助函数来处理自定义按钮
const addPropsToElement = (element: React.ReactNode, props: any) => {
  if (isValidElement(element)) {
    return cloneElement(element, props);
  }
  return element;
};

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onReload,
  customUI
}) => {
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 自动隐藏控件
  useEffect(() => {
    const hideControls = () => {
      if (!isDragging) {
        setShowControls(false);
      }
    };

    if (isPlaying && !isDragging && showControls) {
      controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, isDragging]);

  // 主题颜色
  const theme = customUI?.theme || 'dark';
  const themeColors = {
    light: {
      background: 'rgba(255, 255, 255, 0.8)',
      text: '#000000',
      icon: '#000000',
      slider: '#1890ff',
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.6)',
      text: '#ffffff',
      icon: '#ffffff',
      slider: '#1890ff',
    },
  };

  const colors = themeColors[theme];

  // 控件容器样式
  const controlsContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '10px 16px',
    background: `linear-gradient(transparent, ${colors.background})`,
    transition: 'opacity 0.3s ease',
    opacity: showControls ? 1 : 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 10,
  };

  // 进度条样式
  const progressContainerStyle: React.CSSProperties = {
    width: '100%',
    padding: '0 2px',
  };

  // 按钮容器样式
  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  };

  // 音量控制样式
  const volumeControlStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  };

  const volumeSliderStyle: React.CSSProperties = {
    width: 80,
    marginLeft: 8,
    display: showVolumeSlider ? 'block' : 'none',
  };

  return (
    <div 
      style={controlsContainerStyle}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying && !isDragging) {
          controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
        }
      }}
    >
      {/* 进度条 */}
      <div style={progressContainerStyle}>
        {customUI?.progressBar || (
          <Row align="middle" gutter={8}>
            <Col flex="40px">
              <span style={{ color: colors.text, fontSize: '12px' }}>
                {formatTime(currentTime)}
              </span>
            </Col>
            <Col flex="auto">
              <Slider
                value={currentTime}
                min={0}
                max={duration || 100}
                onChange={(value) => {
                  onSeek(value);
                }}
                onAfterChange={() => setIsDragging(false)}
                onBeforeChange={() => setIsDragging(true)}
                tooltip={{ formatter: (value) => formatTime(value || 0) }}
                styles={{ 
                  track: { backgroundColor: colors.slider },
                  rail: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  handle: { borderColor: colors.slider }
                }}
              />
            </Col>
            <Col flex="40px">
              <span style={{ color: colors.text, fontSize: '12px' }}>
                {formatTime(duration || 0)}
              </span>
            </Col>
          </Row>
        )}
      </div>

      {/* 控制按钮 */}
      <div style={buttonContainerStyle}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* 播放/暂停按钮 */}
          {isPlaying ? (
            customUI?.pauseButton ? 
              addPropsToElement(customUI.pauseButton, { onClick: onPause }) : (
              <Button 
                type="text" 
                icon={<PauseCircleOutlined style={{ color: colors.icon, fontSize: '24px' }} />} 
                onClick={onPause}
              />
            )
          ) : (
            customUI?.playButton ? 
              addPropsToElement(customUI.playButton, { onClick: onPlay }) : (
              <Button 
                type="text" 
                icon={<PlayCircleOutlined style={{ color: colors.icon, fontSize: '24px' }} />} 
                onClick={onPlay}
              />
            )
          )}

          {/* 音量控制 */}
          <div 
            style={volumeControlStyle}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            {customUI?.volumeButton ? 
              addPropsToElement(customUI.volumeButton, { onClick: onMuteToggle }) : (
              <Button 
                type="text" 
                icon={<SoundOutlined style={{ color: colors.icon }} />} 
                onClick={onMuteToggle}
              />
            )}
            <div style={volumeSliderStyle}>
              <Slider
                value={muted ? 0 : volume * 100}
                min={0}
                max={100}
                onChange={(value) => onVolumeChange(value / 100)}
                styles={{ 
                  track: { backgroundColor: colors.slider },
                  rail: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  handle: { borderColor: colors.slider }
                }}
              />
            </div>
          </div>

          {/* 重新加载按钮 */}
          <Tooltip title="重新加载">
            <Button 
              type="text" 
              icon={<ReloadOutlined style={{ color: colors.icon }} />} 
              onClick={onReload}
            />
          </Tooltip>
        </div>

        <div>
          {/* 全屏按钮 */}
          {customUI?.fullscreenButton ? 
            addPropsToElement(customUI.fullscreenButton, { onClick: onFullscreenToggle }) : (
            <Button 
              type="text" 
              icon={<FullscreenOutlined style={{ color: colors.icon }} />} 
              onClick={onFullscreenToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
};