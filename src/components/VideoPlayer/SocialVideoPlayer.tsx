import React, { useState } from 'react';
import { BaseVideoPlayer, BaseVideoPlayerProps } from './BaseVideoPlayer';
import { SocialActions } from '../Controls/SocialActions';
import type {
  SocialActionsCallbacks,
  SocialActionsState,
  SocialActionsConfig,
  SocialActionsCustomUI
} from '../Controls/SocialActions';

// 社交功能增强组件属性接口
export interface SocialVideoPlayerProps extends BaseVideoPlayerProps {
  // 社交功能配置
  socialActions?: {
    show?: boolean;
    state?: SocialActionsState;
    callbacks?: SocialActionsCallbacks;
    config?: SocialActionsConfig;
    customUI?: SocialActionsCustomUI;
  };
  // 默认社交状态（当未提供state时使用）
  defaultSocialState?: SocialActionsState;
}

export const SocialVideoPlayer: React.FC<SocialVideoPlayerProps> = ({
  socialActions,
  defaultSocialState,
  ...baseProps
}) => {
  // 内部社交状态管理（当外部未提供状态时使用）
  const [internalSocialState, setInternalSocialState] = useState<SocialActionsState>(
    defaultSocialState || {
      isLiked: false,
      isFavorited: false,
      likeCount: 0,
      favoriteCount: 0
    }
  );

  // 使用外部状态或内部状态
  const currentSocialState = socialActions?.state || internalSocialState;

  // 默认社交功能回调（当外部未提供时使用）
  const defaultSocialCallbacks: SocialActionsCallbacks = {
    onLike: (isLiked: boolean) => {
      console.log('点赞状态:', isLiked);
      if (!socialActions?.state) {
        // 只有在使用内部状态时才更新
        setInternalSocialState(prev => ({
          ...prev,
          isLiked,
          likeCount: (prev.likeCount || 0) + (isLiked ? 1 : -1)
        }));
      }
      // 调用外部回调
      socialActions?.callbacks?.onLike?.(isLiked);
    },
    
    onFavorite: (isFavorited: boolean) => {
      console.log('收藏状态:', isFavorited);
      if (!socialActions?.state) {
        setInternalSocialState(prev => ({
          ...prev,
          isFavorited,
          favoriteCount: (prev.favoriteCount || 0) + (isFavorited ? 1 : -1)
        }));
      }
      socialActions?.callbacks?.onFavorite?.(isFavorited);
    },
    
    onShare: () => {
      console.log('分享视频');
      // 默认分享实现
      if (navigator.share) {
        navigator.share({
          title: '精彩视频分享',
          text: '快来看看这个精彩的视频！',
          url: window.location.href
        }).catch(console.error);
      } else {
        // 降级处理：复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href)
          .then(() => alert('链接已复制到剪贴板'))
          .catch(() => alert('分享失败'));
      }
      socialActions?.callbacks?.onShare?.();
    }
  };

  // 合并回调函数
  const mergedCallbacks: SocialActionsCallbacks = {
    onLike: socialActions?.callbacks?.onLike || defaultSocialCallbacks.onLike,
    onFavorite: socialActions?.callbacks?.onFavorite || defaultSocialCallbacks.onFavorite,
    onShare: socialActions?.callbacks?.onShare || defaultSocialCallbacks.onShare
  };

  return (
    <BaseVideoPlayer {...baseProps}>
      {/* 社交功能组件 */}
      {socialActions?.show !== false && (
        <SocialActions
          state={currentSocialState}
          callbacks={mergedCallbacks}
          config={socialActions?.config}
          customUI={socialActions?.customUI}
        />
      )}
    </BaseVideoPlayer>
  );
};