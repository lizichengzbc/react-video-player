import React from 'react';
import { BaseVideoPlayer } from '../src/components/VideoPlayer/BaseVideoPlayer';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const CustomExtensionExample: React.FC = () => {
  const handleDownload = () => {
    console.log('下载视频');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>自定义扩展示例</h2>
      <BaseVideoPlayer
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        width={800}
        height={450}
      >
        {/* 在基础播放器中添加自定义功能 */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000
        }}>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: 'none'
            }}
          >
            下载
          </Button>
        </div>
      </BaseVideoPlayer>
    </div>
  );
};

export default CustomExtensionExample;