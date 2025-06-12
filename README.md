# React Video Player

## 跨平台React视频播放器组件

这是一个功能强大的React视频播放器组件，支持多种视频格式和平台，包括标准视频格式、流媒体和第三方平台。

## 特性

- 支持多种视频格式：MP4、WebM等标准格式
- 支持流媒体协议：HLS、DASH
- 支持第三方平台：YouTube、Vimeo
- 支持WebRTC实时视频流
- 自定义UI和控件
- 错误处理和自动重试
- 响应式设计
- TypeScript支持

## 安装

```bash
npm install react-video-player
# 或
yarn add react-video-player
# 或
pnpm add react-video-player
```

## 基本用法

```jsx
import { VideoPlayer } from 'react-video-player';

function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      width="100%"
      height="400px"
      autoplay={false}
      muted={false}
      controls={true}
    />
  );
}
```

## 支持的引擎

### 1. 原生引擎 (NativeEngine)

使用浏览器原生能力播放标准视频格式。

```jsx
<VideoPlayer src="https://example.com/video.mp4" />
```

### 2. HLS引擎 (HlsEngine)

支持HLS流媒体协议，使用hls.js库。

```jsx
<VideoPlayer src="https://example.com/video.m3u8" />
```

### 3. DASH引擎 (DashEngine)

支持DASH流媒体协议，使用dashjs库。

```jsx
<VideoPlayer src="https://example.com/video.mpd" />
```

### 4. YouTube引擎 (YouTubeEngine)

支持播放YouTube视频，使用YouTube IFrame API。

```jsx
<VideoPlayer src="https://www.youtube.com/watch?v=VIDEO_ID" />
// 或
<VideoPlayer src="https://youtu.be/VIDEO_ID" />
// 或
<VideoPlayer src="youtube:VIDEO_ID" />
```

### 5. Vimeo引擎 (VimeoEngine)

支持播放Vimeo视频，使用Vimeo Player API。

```jsx
<VideoPlayer src="https://vimeo.com/VIDEO_ID" />
// 或
<VideoPlayer src="https://player.vimeo.com/video/VIDEO_ID" />
// 或
<VideoPlayer src="vimeo:VIDEO_ID" />
```

### 6. WebRTC引擎 (WebRTCEngine)

支持WebRTC实时视频流，需要配置信令服务器。

```jsx
<VideoPlayer src="webrtc:wss://signalling-server.com" />
// 或带ICE服务器配置
<VideoPlayer src="webrtc:wss://signalling-server.com?iceServers=[{\"urls\":\"stun:stun.l.google.com:19302\"}]" />
```

## 高级用法

### 自定义UI

```jsx
<VideoPlayer
  src="https://example.com/video.mp4"
  customUI={{
    theme: {
      primaryColor: '#1890ff',
      secondaryColor: '#f5222d'
    },
    playButton: <CustomPlayIcon />,
    pauseButton: <CustomPauseIcon />,
    volumeButton: <CustomVolumeIcon />,
    fullscreenButton: <CustomFullscreenIcon />,
    progressBar: <CustomProgressBar />,
    buttonPosition: 'center' // 'bottom', 'center'
  }}
/>
```

### 错误处理

```jsx
<VideoPlayer
  src="https://example.com/video.mp4"
  onError={(error) => console.error('Video error:', error)}
  showErrorOverlay={true}
  maxRetries={3}
  onRetry={(attempt) => console.log(`Retry attempt: ${attempt}`)}
/>
```

### 事件回调

```jsx
<VideoPlayer
  src="https://example.com/video.mp4"
  onPlay={() => console.log('Video started playing')}
  onPause={() => console.log('Video paused')}
  onEnded={() => console.log('Video ended')}
  onTimeUpdate={(time) => console.log(`Current time: ${time}`)}
/>
```

## API参考

### VideoPlayer Props

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| src | string | - | 视频源URL |
| width | string \| number | '100%' | 播放器宽度 |
| height | string \| number | 'auto' | 播放器高度 |
| autoplay | boolean | false | 是否自动播放 |
| muted | boolean | false | 是否静音 |
| loop | boolean | false | 是否循环播放 |
| controls | boolean | true | 是否显示控件 |
| poster | string | - | 封面图片URL |
| className | string | - | 自定义CSS类名 |
| customUI | object | - | 自定义UI配置 |
| showErrorOverlay | boolean | true | 是否显示错误覆盖层 |
| maxRetries | number | 3 | 加载失败时最大重试次数 |
| onPlay | function | - | 播放开始回调 |
| onPause | function | - | 暂停回调 |
| onEnded | function | - | 播放结束回调 |
| onError | function | - | 错误回调 |
| onTimeUpdate | function | - | 时间更新回调 |
| onRetry | function | - | 重试回调 |

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. YouTube和Vimeo引擎需要互联网连接才能加载视频
2. WebRTC引擎需要配置有效的信令服务器
3. 某些浏览器可能对特定格式有限制
4. 自动播放可能受到浏览器策略限制，通常需要静音才能自动播放

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test
```

## 许可证

ISC