import React from 'react';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';

const BasicUsage: React.FC = () => {
  return (
    <div>
      {/* HLS视频 */}
      <VideoPlayer
        src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        width={800}
        height={450}
        controls
        onError={(error) => console.error('播放错误:', error)}
      />
      
      {/* DASH视频 */}
      <VideoPlayer
        src="https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
        width={800}
        height={450}
        controls
      />
      
      {/* 普通MP4视频 */}
      <VideoPlayer
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        width={800}
        height={450}
        controls
      />
    </div>
  );
};

export default BasicUsage;
