import React, { useState } from 'react';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';
import { Select, Space, Typography, Card, Row, Col } from 'antd';

const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * 高级引擎示例组件 - 展示如何使用各种视频引擎
 */
const AdvancedEnginesExample: React.FC = () => {
  // 视频源列表
  const videoSources = {
    mp4: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    dash: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',  // Big Buck Bunny on YouTube
    vimeo: 'https://vimeo.com/1084537',                     // Big Buck Bunny on Vimeo
    webrtc: 'webrtc:wss://example.com/webrtc-signalling'    // 示例WebRTC URL（需要替换为实际可用的信令服务器）
  };

  // 当前选择的视频源
  const [currentSource, setCurrentSource] = useState(videoSources.mp4);
  const [currentType, setCurrentType] = useState('mp4');

  // 处理视频源变更
  const handleSourceChange = (value: string) => {
    setCurrentSource(videoSources[value as keyof typeof videoSources]);
    setCurrentType(value);
  };

  // 处理错误
  const handleError = (error: Error) => {
    console.error('Video playback error:', error.message);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography>
        <Title level={2}>高级视频引擎示例</Title>
        <Paragraph>
          这个示例展示了如何使用各种视频引擎，包括标准格式（MP4）、流媒体格式（HLS、DASH）
          以及第三方平台（YouTube、Vimeo）和实时流（WebRTC）。
        </Paragraph>
      </Typography>

      <Space direction="vertical" style={{ width: '100%', marginBottom: '20px' }}>
        <div>
          <span style={{ marginRight: '10px' }}>选择视频源类型:</span>
          <Select 
            defaultValue="mp4" 
            style={{ width: 200 }} 
            onChange={handleSourceChange}
          >
            <Option value="mp4">MP4 (标准视频)</Option>
            <Option value="hls">HLS (流媒体)</Option>
            <Option value="dash">DASH (流媒体)</Option>
            <Option value="youtube">YouTube</Option>
            <Option value="vimeo">Vimeo</Option>
            <Option value="webrtc">WebRTC (实时流)</Option>
          </Select>
        </div>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={`当前播放: ${currentType.toUpperCase()}`}>
            <VideoPlayer
              src={currentSource}
              width="100%"
              height="500px"
              autoplay={false}
              muted={false}
              controls={true}
              onError={handleError}
              showErrorOverlay={true}
              maxRetries={3}
              customUI={{
                theme: {
                  primaryColor: '#1890ff',
                  secondaryColor: '#f5222d'
                },
                buttonPosition: 'center'
              }}
            />
          </Card>
        </Col>
      </Row>

      <Typography style={{ marginTop: '20px' }}>
        <Title level={4}>注意事项</Title>
        <Paragraph>
          <ul>
            <li>YouTube和Vimeo引擎需要互联网连接才能加载视频。</li>
            <li>WebRTC示例需要配置有效的信令服务器才能工作。</li>
            <li>不同引擎的功能和控制方式可能略有不同。</li>
            <li>某些浏览器可能对特定格式有限制。</li>
          </ul>
        </Paragraph>
      </Typography>
    </div>
  );
};

export default AdvancedEnginesExample;