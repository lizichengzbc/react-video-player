import React, { useState } from 'react';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';

const ErrorHandlingExample: React.FC = () => {
  const [currentSrc, setCurrentSrc] = useState('https://cdn.pixabay.com/video/2024/03/10/203678-922748476_large.mp4');
  const [errorCount, setErrorCount] = useState(0);

  const handleError = (error: Error) => {
    console.error('Video error occurred:', error);
    setErrorCount(prev => prev + 1);
  };

  const handleRetry = () => {
    console.log('User initiated retry');
    // 可以在这里添加额外的重试逻辑
    // 比如切换到备用视频源
  };

  const switchToBackupSource = () => {
    setCurrentSrc('https://backup.example.com/video.mp4');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>错误处理示例</h2>
      
      <VideoPlayer
        src={currentSrc}
        width={800}
        height={450}
        controls
        onError={handleError}
        onRetry={handleRetry}
        showErrorOverlay={true}
      />
      
      <div style={{ marginTop: '20px' }}>
        <p>错误次数: {errorCount}</p>
        <button onClick={switchToBackupSource}>
          切换到备用视频源
        </button>
      </div>
    </div>
  );
};

export default ErrorHandlingExample;