import React, { useState } from 'react';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
import './App.css';

const App: React.FC = () => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);

  // 测试视频源
  const testSources = [
    {
      name: 'MP4 测试视频',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video/mp4'
    },
    {
      name: 'HLS 测试流',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'application/vnd.apple.mpegurl'
    },
    {
      name: 'DASH 测试流',
      url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
      type: 'application/dash+xml'
    }
  ];

  const handleSourceChange = (url: string) => {
    setCurrentSrc(url);
    setErrorCount(0);
  };

  const handleError = (error: Error) => {
    console.error('视频播放错误:', error);
    setErrorCount(prev => prev + 1);
  };

  const handleRetry = () => {
    console.log('用户触发重试');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>React 视频播放器组件</h1>
        <p>支持 HLS、DASH 和原生视频格式的跨平台播放器</p>
      </header>

      <main className="app-main">
        {/* 视频源选择 */}
        <section className="source-selector">
          <h2>选择测试视频源</h2>
          <div className="source-buttons">
            {testSources.map((source, index) => (
              <button
                key={index}
                onClick={() => handleSourceChange(source.url)}
                className={currentSrc === source.url ? 'active' : ''}
              >
                {source.name}
              </button>
            ))}
          </div>
        </section>

        {/* 视频播放器 */}
        <section className="video-section">
          {currentSrc ? (
            <div className="video-container">
              <VideoPlayer
                src={currentSrc}
                width="100%"
                height={450}
                controls
                onError={handleError}
                onRetry={handleRetry}
                showErrorOverlay={true}
                onPlay={() => console.log('播放开始')}
                onPause={() => console.log('播放暂停')}
                onTimeUpdate={(time) => console.log('时间更新:', time)}
              />
              
              <div className="video-info">
                <p><strong>当前视频源:</strong> {currentSrc}</p>
                <p><strong>错误次数:</strong> {errorCount}</p>
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <p>请选择一个视频源开始测试</p>
            </div>
          )}
        </section>

        {/* 功能说明 */}
        <section className="features">
          <h2>组件特性</h2>
          <div className="feature-grid">
            <div className="feature-item">
              <h3>🎥 多格式支持</h3>
              <p>支持 HLS (.m3u8)、DASH (.mpd) 和原生格式 (.mp4, .webm)</p>
            </div>
            <div className="feature-item">
              <h3>🔄 智能重试</h3>
              <p>自动错误检测和重试机制，提升播放成功率</p>
            </div>
            <div className="feature-item">
              <h3>📱 跨平台兼容</h3>
              <p>支持桌面和移动端浏览器，自动选择最佳播放引擎</p>
            </div>
            <div className="feature-item">
              <h3>⚡ 性能优化</h3>
              <p>事件驱动架构，避免轮询，内存泄漏防护</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;