import React, { useState } from 'react';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
import { Button, Select, Space, Typography, Card, Divider } from 'antd';
import { PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons';
import './App.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;

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

  const handleError = (error: Error) => {
    console.error('视频播放错误:', error);
    setErrorCount(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <Card className="header-card">
        <Title level={2}>React 视频播放器演示</Title>
        <Paragraph>
          选择一个视频源进行测试：
        </Paragraph>
        <Space>
          <Select 
            placeholder="选择视频源" 
            style={{ width: 200 }}
            onChange={(value) => setCurrentSrc(value)}
          >
            {testSources.map((source, index) => (
              <Option key={index} value={source.url}>{source.name}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => setCurrentSrc('')}>
            清除
          </Button>
        </Space>
      </Card>

      <Divider>标准播放器</Divider>
      
      <Card className="player-card">
        <VideoPlayer
          src={currentSrc}
          width="60%"
          controls
          onError={handleError}
          onRetry={() => console.log('重试中...')}
          showErrorOverlay={true}
          maxRetries={5}
        />
      </Card>

      <Divider>自定义UI播放器</Divider>
      
      <Card className="player-card">
        <VideoPlayer
          src={currentSrc}
          width="60%"
          controls
          onError={handleError}
          onRetry={() => console.log('重试中...')}
          showErrorOverlay={true}
          maxRetries={5}
          customUI={{
            theme: 'dark',
            playButton: <Button type="text" icon={<PlayCircleFilled style={{ color: '#1890ff', fontSize: '28px' }} />} />,
            pauseButton: <Button type="text" icon={<PauseCircleFilled style={{ color: '#1890ff', fontSize: '28px' }} />} />
          }}
        />
      </Card>

      <Card className="feature-card">
        <Title level={3}>特性</Title>
        <ul>
          <li>支持多种视频格式 (MP4, HLS, DASH)</li>
          <li>智能重试机制</li>
          <li>自定义控件和UI</li>
          <li>跨平台兼容</li>
          <li>性能优化</li>
        </ul>
      </Card>
    </div>
  );
};

export default App;