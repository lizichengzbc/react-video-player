import React from 'react';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';

const App: React.FC = () => {
  return (
    <div>
      {/* HLS视频 */}
      <VideoPlayer
        src="https://example.com/video.m3u8"
        width={800}
        height={450}
        controls
        onError={(error) => console.error('播放错误:', error)}
      />
      
      {/* DASH视频 */}
      <VideoPlayer
        src="https://example.com/video.mpd"
        width={800}
        height={450}
        controls
      />
      
      {/* 普通MP4视频 */}
      <VideoPlayer
        src="https://cdn.pixabay.com/video/2024/03/10/203678-922748476_large.mp4"
        width={800}
        height={450}
        controls
      />
    </div>
  );
};

export default App;