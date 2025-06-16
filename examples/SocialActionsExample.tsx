import React, { useState } from 'react';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';
import { SocialActionsCallbacks, SocialActionsState } from '../src/components/Controls/SocialActions';

const SocialActionsExample: React.FC = () => {
  // 社交功能状态管理
  const [socialState, setSocialState] = useState<SocialActionsState>({
    isLiked: false,
    isFavorited: false,
    likeCount: 128,
    favoriteCount: 45
  });

  // 社交功能回调函数
  const socialCallbacks: SocialActionsCallbacks = {
    onLike: (isLiked: boolean) => {
      console.log('点赞状态:', isLiked);
      setSocialState(prev => ({
        ...prev,
        isLiked,
        likeCount: prev.likeCount! + (isLiked ? 1 : -1)
      }));
      // 这里可以调用API更新服务器状态
    },
    
    onFavorite: (isFavorited: boolean) => {
      console.log('收藏状态:', isFavorited);
      setSocialState(prev => ({
        ...prev,
        isFavorited,
        favoriteCount: prev.favoriteCount! + (isFavorited ? 1 : -1)
      }));
      // 这里可以调用API更新服务器状态
    },
    
    onShare: () => {
      console.log('分享视频');
      // 实现分享逻辑，例如：
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
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>社交功能示例</h2>
      <VideoPlayer
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        width={800}
        height={450}
        socialActions={{
          show: true,
          state: socialState,
          callbacks: socialCallbacks,
          config: {
            showLike: true,
            showFavorite: true,
            showShare: true,
            showCounts: true,
            position: 'top-right',
            theme: 'dark'
          }
        }}
      />
    </div>
  );
};

export default SocialActionsExample;