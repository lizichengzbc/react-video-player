/**
 * 快速开始示例 - 展示如何在新项目中使用 React Video Player
 * 这个示例可以直接复制到新的React项目中使用
 */

import React, { useState } from 'react';
import { VideoPlayer } from '@lzc-org/react-video-player';
import type { VideoSource, VideoPlayerConfig, SocialActions } from '@lzc-org/react-video-player';

// 示例视频源配置
const videoSources: VideoSource[] = [
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video/mp4',
    title: 'Big Buck Bunny (MP4)'
  },
  {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'application/x-mpegURL',
    title: 'HLS 测试流'
  },
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'video/youtube',
    title: 'YouTube 示例'
  }
];

const QuickStartExample: React.FC = () => {
  const [currentSource, setCurrentSource] = useState<VideoSource>(videoSources[0]);
  const [showSocial, setShowSocial] = useState(false);

  // 播放器配置
  const config: VideoPlayerConfig = {
    hls: {
      enableWorker: true,
      lowLatencyMode: false
    },
    debug: true // 开发环境下启用调试
  };

  // 社交功能配置
  const socialActions: SocialActions = {
    onLike: () => {
      console.log('用户点赞了视频:', currentSource.title);
      alert('点赞成功！');
    },
    onShare: () => {
      console.log('用户分享了视频:', currentSource.title);
      if (navigator.share) {
        navigator.share({
          title: currentSource.title,
          url: currentSource.url
        });
      } else {
        // 降级处理：复制到剪贴板
        navigator.clipboard.writeText(currentSource.url);
        alert('链接已复制到剪贴板！');
      }
    },
    onComment: () => {
      console.log('用户要评论视频:', currentSource.title);
      const comment = prompt('请输入您的评论:');
      if (comment) {
        alert(`评论已提交: ${comment}`);
      }
    },
    onSubscribe: () => {
      console.log('用户订阅了频道');
      alert('订阅成功！感谢您的支持！');
    }
  };

  // 错误处理
  const handleError = (error: Error) => {
    console.error('视频播放错误:', error);
    alert(`播放出错: ${error.message}`);
  };

  // 重试处理
  const handleRetry = () => {
    console.log('重试播放视频:', currentSource.title);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>React Video Player 快速开始示例</h1>
      
      {/* 视频源选择器 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>选择视频源:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {videoSources.map((source, index) => (
            <button
              key={index}
              onClick={() => setCurrentSource(source)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: currentSource.url === source.url ? '#1890ff' : '#fff',
                color: currentSource.url === source.url ? '#fff' : '#000',
                cursor: 'pointer'
              }}
            >
              {source.title}
            </button>
          ))}
        </div>
      </div>

      {/* 功能开关 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={showSocial}
            onChange={(e) => setShowSocial(e.target.checked)}
          />
          显示社交功能按钮
        </label>
      </div>

      {/* 视频播放器 */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <VideoPlayer
          source={currentSource}
          config={config}
          width="100%"
          height="500px"
          autoPlay={false}
          controls={true}
          muted={false}
          loop={false}
          socialActions={socialActions}
          showSocialActions={showSocial}
          onError={handleError}
          onRetry={handleRetry}
          maxRetries={3}
          retryDelay={2000}
        />
      </div>

      {/* 当前播放信息 */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4>当前播放:</h4>
        <p><strong>标题:</strong> {currentSource.title}</p>
        <p><strong>URL:</strong> {currentSource.url}</p>
        <p><strong>类型:</strong> {currentSource.type}</p>
      </div>

      {/* 使用说明 */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
        <h4>使用说明:</h4>
        <ul>
          <li>点击上方按钮切换不同的视频源</li>
          <li>勾选复选框可以显示/隐藏社交功能按钮</li>
          <li>支持 MP4、HLS、YouTube 等多种视频格式</li>
          <li>具备完整的错误处理和重试机制</li>
          <li>响应式设计，适配各种屏幕尺寸</li>
        </ul>
      </div>

      {/* 安装说明 */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
        <h4>安装方法:</h4>
        <pre style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
          <code>
{`npm install @lzc-org/react-video-player

# 或使用 pnpm
pnpm add @lzc-org/react-video-player

# 或使用 yarn
yarn add @lzc-org/react-video-player`}
          </code>
        </pre>
      </div>

      {/* 基础代码示例 */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
        <h4>基础使用代码:</h4>
        <pre style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
          <code>
{`import { VideoPlayer } from '@lzc-org/react-video-player';
import type { VideoSource } from '@lzc-org/react-video-player';

const App = () => {
  const source: VideoSource = {
    url: 'https://example.com/video.mp4',
    type: 'video/mp4',
    title: '我的视频'
  };

  return (
    <VideoPlayer
      source={source}
      width="100%"
      height="400px"
      controls={true}
    />
  );
};`}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default QuickStartExample;