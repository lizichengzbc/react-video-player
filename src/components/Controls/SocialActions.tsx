import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  StarFilled,
  ShareAltOutlined,
} from '@ant-design/icons';

// 社交功能回调函数类型定义
export interface SocialActionsCallbacks {
  onLike?: (isLiked: boolean) => void;
  onFavorite?: (isFavorited: boolean) => void;
  onShare?: () => void;
}

// 社交功能状态类型定义
export interface SocialActionsState {
  isLiked?: boolean;
  isFavorited?: boolean;
  likeCount?: number;
  favoriteCount?: number;
}

// 社交功能显示配置
export interface SocialActionsConfig {
  showLike?: boolean;
  showFavorite?: boolean;
  showShare?: boolean;
  showCounts?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  theme?: 'light' | 'dark';
}

// 自定义UI配置
export interface SocialActionsCustomUI {
  likeButton?: React.ReactNode;
  favoriteButton?: React.ReactNode;
  shareButton?: React.ReactNode;
  likeIcon?: React.ReactNode;
  favoriteIcon?: React.ReactNode;
  shareIcon?: React.ReactNode;
}

export interface SocialActionsProps {
  // 状态数据
  state?: SocialActionsState;
  // 回调函数
  callbacks?: SocialActionsCallbacks;
  // 显示配置
  config?: SocialActionsConfig;
  // 自定义UI
  customUI?: SocialActionsCustomUI;
  // 样式类名
  className?: string;
}

export const SocialActions: React.FC<SocialActionsProps> = ({
  state = {},
  callbacks = {},
  config = {},
  customUI = {},
  className
}) => {
  const {
    isLiked = false,
    isFavorited = false,
    likeCount = 0,
    favoriteCount = 0
  } = state;

  const {
    onLike,
    onFavorite,
    onShare
  } = callbacks;

  const {
    showLike = true,
    showFavorite = true,
    showShare = true,
    showCounts = true,
    position = 'top-right',
    theme = 'dark'
  } = config;

  // 处理点赞
  const handleLike = () => {
    onLike?.(!isLiked);
  };

  // 处理收藏
  const handleFavorite = () => {
    onFavorite?.(!isFavorited);
  };

  // 处理分享
  const handleShare = () => {
    onShare?.();
  };

  // 主题样式
  const themeStyles = {
    light: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#000000',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    }
  };

  // 位置样式
  const positionStyles = {
    'top-right': { top: '16px', right: '16px' },
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '60px', right: '16px' },
    'bottom-left': { bottom: '60px', left: '16px' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    ...positionStyles[position],
    zIndex: 1000,
    padding: '8px 12px',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    ...themeStyles[theme],
    boxShadow: themeStyles[theme].shadow,
    border: themeStyles[theme].border,
    transition: 'all 0.3s ease'
  };

  const buttonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: themeStyles[theme].color,
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    color: '#ff4d4f' // 激活状态的红色
  };

  return (
    <div style={containerStyle} className={className}>
      <Space direction="vertical" size="small">
        {/* 点赞按钮 */}
        {showLike && (
          <Tooltip title={isLiked ? '取消点赞' : '点赞'} placement="left">
            {customUI.likeButton ? (
              <div onClick={handleLike}>
                {customUI.likeButton}
              </div>
            ) : (
              <Button
                type="text"
                style={isLiked ? activeButtonStyle : buttonStyle}
                onClick={handleLike}
                icon={
                  customUI.likeIcon || 
                  (isLiked ? <HeartFilled /> : <HeartOutlined />)
                }
              >
                {showCounts && likeCount > 0 && (
                  <span style={{ fontSize: '12px' }}>{likeCount}</span>
                )}
              </Button>
            )}
          </Tooltip>
        )}

        {/* 收藏按钮 */}
        {showFavorite && (
          <Tooltip title={isFavorited ? '取消收藏' : '收藏'} placement="left">
            {customUI.favoriteButton ? (
              <div onClick={handleFavorite}>
                {customUI.favoriteButton}
              </div>
            ) : (
              <Button
                type="text"
                style={isFavorited ? activeButtonStyle : buttonStyle}
                onClick={handleFavorite}
                icon={
                  customUI.favoriteIcon || 
                  (isFavorited ? <StarFilled /> : <StarOutlined />)
                }
              >
                {showCounts && favoriteCount > 0 && (
                  <span style={{ fontSize: '12px' }}>{favoriteCount}</span>
                )}
              </Button>
            )}
          </Tooltip>
        )}

        {/* 分享按钮 */}
        {showShare && (
          <Tooltip title="分享" placement="left">
            {customUI.shareButton ? (
              <div onClick={handleShare}>
                {customUI.shareButton}
              </div>
            ) : (
              <Button
                type="text"
                style={buttonStyle}
                onClick={handleShare}
                icon={customUI.shareIcon || <ShareAltOutlined />}
              />
            )}
          </Tooltip>
        )}
      </Space>
    </div>
  );
};
