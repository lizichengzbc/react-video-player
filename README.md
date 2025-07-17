
# React Video Player

[![npm version](https://badge.fury.io/js/@lzc-org%2Freact-video-player.svg)](https://badge.fury.io/js/@lzc-org%2Freact-video-player)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

## 🎬 跨平台React视频播放器组件

这是一个功能强大、高度可定制的React视频播放器组件库，支持多种视频格式和平台，包括标准视频格式、流媒体和第三方平台。现在还支持社交功能，如点赞、收藏和分享。

### ✨ 为什么选择这个播放器？

- 🚀 **高性能**: 优化的渲染和内存管理
- 🎯 **多引擎支持**: 自动选择最佳播放引擎
- 🎨 **高度可定制**: 完全自定义UI和交互
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- 🔧 **TypeScript**: 完整的类型支持
- 🧩 **模块化架构**: 按需加载，减少包体积

## 📋 目录

- [安装](#安装)
- [基本用法](#基本用法)
  - [基础播放器](#基础播放器)
  - [带社交功能的播放器](#带社交功能的播放器)
  - [完整功能播放器](#完整功能播放器向后兼容)
- [支持的引擎](#支持的引擎)
- [高级用法](#高级用法)
- [API参考](#api参考)
- [组件架构](#组件架构)
- [浏览器兼容性](#浏览器兼容性)
- [性能优化](#性能优化)
- [开发](#️-开发)
- [示例项目](#-示例项目)
- [贡献](#-贡献)

## 特性

### 🎥 播放功能
- 支持多种视频格式：MP4、WebM等标准格式
- 支持流媒体协议：HLS、DASH
- 支持第三方平台：YouTube、Vimeo
- 支持WebRTC实时视频流
- 自定义UI和控件
- 错误处理和自动重试
- 响应式设计

### 🎯 社交功能
- 点赞功能：支持点赞/取消点赞，显示点赞数量
- 收藏功能：支持收藏/取消收藏，显示收藏数量
- 分享功能：支持原生分享API，降级到复制链接
- 可选显示：每个按钮都可以独立控制显示/隐藏
- 自定义回调：完全由用户实现业务逻辑

### 🏗️ 架构设计
- **VideoPlayer**: 统一的视频播放器组件，支持所有功能（~60KB gzipped）
- **VideoPlayer**: 保持向后兼容的完整功能组件
- **完整TypeScript支持**: 类型安全，智能提示
- **组件化设计**: 易于扩展和维护
- **零依赖核心**: 核心功能不依赖第三方库

### 🎮 控制功能
- 播放/暂停控制
- 进度条拖拽
- 音量控制
- 全屏切换
- 播放速度调节
- 画中画模式
- 键盘快捷键支持

### 🔧 技术特性
- **自适应引擎选择**: 根据视频源自动选择最佳播放引擎
- **错误恢复机制**: 自动重试和降级策略
- **内存管理**: 自动清理资源，防止内存泄漏
- **事件系统**: 完整的播放事件回调
- **主题系统**: 支持亮色/暗色主题

## 安装

```bash
npm install @lzc-org/react-video-player
# 或
yarn add @lzc-org/react-video-player
# 或
pnpm add @lzc-org/react-video-player
```

## 基本用法

### 基础播放器

```jsx
import { VideoPlayer } from '@lzc-org/react-video-player';

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

### 带社交功能的播放器

```jsx
import { VideoPlayer } from '@lzc-org/react-video-player';
import { useState } from 'react';

function App() {
  const [socialState, setSocialState] = useState({
    isLiked: false,
    isFavorited: false,
    likeCount: 42,
    favoriteCount: 15
  });

  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      width="100%"
      height="400px"
      socialActions={{
        show: true,
        state: socialState,
        callbacks: {
          onLike: (isLiked) => {
            setSocialState(prev => ({
              ...prev,
              isLiked,
              likeCount: prev.likeCount + (isLiked ? 1 : -1)
            }));
            // 调用API更新服务器状态
            console.log('更新点赞状态:', isLiked);
          },
          onFavorite: (isFavorited) => {
            setSocialState(prev => ({
              ...prev,
              isFavorited,
              favoriteCount: prev.favoriteCount + (isFavorited ? 1 : -1)
            }));
            console.log('更新收藏状态:', isFavorited);
          },
          onShare: () => {
            console.log('分享视频');
            // 自定义分享逻辑
          }
        },
        config: {
          showLike: true,
          showFavorite: true,
          showShare: true,
          position: 'top-right',
          theme: 'dark'
        }
      }}
    />
  );
}
```

### 完整功能播放器（向后兼容）

```jsx
import { VideoPlayer } from '@lzc-org/react-video-player';

function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      width="100%"
      height="400px"
      autoplay={false}
      muted={false}
      controls={true}
      socialActions={{
        show: true,
        config: {
          position: 'top-right',
          theme: 'dark'
        }
      }}
    />
  );
}
```

## 🚀 引擎选择改进

### 智能引擎选择

我们对引擎选择机制进行了重大改进，解决了原有方法仅依赖URL判断的局限性。新的实现采用多层检测策略，能够更准确地为各种视频源选择合适的播放引擎。

#### 主要改进

- **多层检测机制**：结合URL模式、文件扩展名、HTTP头信息进行检测
- **浏览器支持验证**：检查浏览器是否真正支持检测到的格式
- **异步检测支持**：新增 `createEngineAsync()` 方法，支持HTTP头检测
- **缓存机制**：避免重复检测，提高性能
- **超时控制**：防止网络检测阻塞
- **后备机制**：多重后备策略确保总能找到可用引擎

#### 使用示例

```jsx
import { EngineFactory } from '@lzc-org/react-video-player';

// 同步方法 - 适用于简单场景
const engine = EngineFactory.createEngine(videoUrl, videoElement);

// 异步方法 - 推荐用于复杂场景（如无扩展名的流媒体URL）
const engine = await EngineFactory.createEngineAsync(videoUrl, videoElement, {
  useCache: true,              // 启用缓存
  enableHeaderDetection: true, // 启用HTTP头检测
  timeout: 3000               // 检测超时时间
});

// 增强检测 - 包含负载测试
const result = await EngineFactory.selectEngine(videoUrl, videoElement, {
  useCache: true,
  performLoadTest: true,
  preferredEngines: ['hls', 'dash', 'native'],
  fallbackToNative: true
});
```

#### 支持的检测场景

- ✅ **标准视频文件**：`https://example.com/video.mp4`
- ✅ **流媒体URL（无扩展名）**：`https://api.example.com/stream/12345`
- ✅ **特殊平台**：YouTube、Vimeo、WebRTC
- ✅ **复杂URL**：带查询参数、片段标识符的URL
- ✅ **HTTP头检测**：通过Content-Type确定真实格式

详细说明请参考：[引擎选择改进说明](./docs/引擎选择改进说明.md)

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

### 自定义扩展

```jsx
import { VideoPlayer } from '@lzc-org/react-video-player';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

function CustomPlayer() {
  const handleDownload = () => {
    console.log('下载视频');
  };

  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      width={800}
      height={450}
      controls={true}
      autoplay={false}
    >
      {/* 在播放器中添加自定义功能 */}
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
        >
          下载
        </Button>
      </div>
    </VideoPlayer>
  );
}
```

### 自定义UI

```jsx
<VideoPlayer
  src="https://example.com/video.mp4"
  customUI={{
    theme: 'dark',
    playButton: <CustomPlayIcon />,
    pauseButton: <CustomPauseIcon />,
    volumeButton: <CustomVolumeIcon />,
    fullscreenButton: <CustomFullscreenIcon />,
    progressBar: <CustomProgressBar />,
    buttonPosition: 'center'
  }}
  socialActions={{
    show: true,
    customUI: {
      likeButton: <CustomLikeButton />,
      favoriteButton: <CustomFavoriteButton />,
      shareButton: <CustomShareButton />
    }
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

| 属性             | 类型            | 默认值 | 描述                   |
| ---------------- | --------------- | ------ | ---------------------- |
| src              | string          | -      | 视频源URL              |
| width            | string\| number | '100%' | 播放器宽度             |
| height           | string\| number | 'auto' | 播放器高度             |
| autoplay         | boolean         | false  | 是否自动播放           |
| muted            | boolean         | false  | 是否静音               |
| loop             | boolean         | false  | 是否循环播放           |
| controls         | boolean         | true   | 是否显示控件           |
| poster           | string          | -      | 封面图片URL            |
| className        | string          | -      | 自定义CSS类名          |
| customUI         | object          | -      | 自定义UI配置           |
| showErrorOverlay | boolean         | true   | 是否显示错误覆盖层     |
| maxRetries       | number          | 3      | 加载失败时最大重试次数 |
| children         | ReactNode       | -      | 自定义子组件           |
| onPlay           | function        | -      | 播放开始回调           |
| onPause          | function        | -      | 暂停回调               |
| onEnded          | function        | -      | 播放结束回调           |
| onError          | function        | -      | 错误回调               |
| onTimeUpdate     | function        | -      | 时间更新回调           |
| onRetry          | function        | -      | 重试回调               |

### 社交功能配置

通过 `socialActions` 属性配置：

| 属性               | 类型   | 默认值 | 描述         |
| ------------------ | ------ | ------ | ------------ |
| socialActions      | object | -      | 社交功能配置 |
| defaultSocialState | object | -      | 默认社交状态 |

### SocialActions 配置

```typescript
interface SocialActionsConfig {
  show?: boolean;                    // 是否显示社交功能
  state?: {                         // 社交状态
    isLiked?: boolean;
    isFavorited?: boolean;
    likeCount?: number;
    favoriteCount?: number;
  };
  callbacks?: {                     // 回调函数
    onLike?: (isLiked: boolean) => void;
    onFavorite?: (isFavorited: boolean) => void;
    onShare?: () => void;
  };
  config?: {                        // 显示配置
    showLike?: boolean;
    showFavorite?: boolean;
    showShare?: boolean;
    showCounts?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
    theme?: 'light' | 'dark';
  };
  customUI?: {                      // 自定义UI
    likeButton?: ReactNode;
    favoriteButton?: ReactNode;
    shareButton?: ReactNode;
    likeIcon?: ReactNode;
    favoriteIcon?: ReactNode;
    shareIcon?: ReactNode;
  };
}
```

## 组件架构

### 组件层次结构

```
VideoPlayer (完整功能，向后兼容)
├── VideoPlayer (统一播放器组件)
│   │   ├── VideoControls (播放控件)
│   │   ├── ErrorOverlay (错误处理)
│   │   └── children (自定义扩展)
│   └── SocialActions (社交功能)
└── 其他自定义组件
```

### 使用建议

- **基础播放**: 使用 `VideoPlayer` 的基础功能
- **社交功能**: 通过 `socialActions` 属性启用
- **自定义扩展**: 使用 `children` 属性添加自定义内容
- **向后兼容**: 继续使用 `VideoPlayer`

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
5. 社交功能的数据持久化需要用户自行实现
6. 分享功能在不支持Web Share API的浏览器中会降级到复制链接

## 性能优化

- 按需启用功能可以减少不必要的资源加载
- 社交功能按需加载，不影响核心播放性能
- 支持懒加载和代码分割
- 优化的状态管理，减少不必要的重渲染
- 正确的资源清理，避免内存泄漏

## 🎨 PostCSS配置

项目已配置PostCSS自动将px单位转换为rem单位，实现更好的响应式设计。

### 配置特性

- **自动转换**: px值自动转换为rem单位（基于16px根字体大小）
- **智能排除**: 自动排除第三方组件库样式（如Ant Design）
- **最小值保护**: 小于2px的值保持不变（如边框）
- **选择性转换**: 支持通过类名排除特定样式

### 转换示例

```css
/* 源码 */
.component {
  font-size: 16px;    /* -> 1rem */
  padding: 24px;      /* -> 1.5rem */
  margin: 32px;       /* -> 2rem */
  border: 1px solid;  /* -> 保持1px */
}

/* 排除转换 */
.no-rem {
  font-size: 16px;    /* -> 保持16px */
}
```

### 配置文件

详细配置请查看：
- `postcss.config.ts` - PostCSS配置文件
- `docs/PostCSS配置说明.md` - 详细使用说明

### 优势

- 🎯 **响应式**: 基于根字体大小的相对单位
- ♿ **可访问性**: 支持用户字体大小调整
- 📱 **移动友好**: 更好的移动端适配
- 🔧 **自动化**: 无需手动转换，构建时自动处理

## 🛠️ 开发

### 环境要求

- Node.js >= 16
- pnpm >= 7

### 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建库文件
pnpm build

# 构建演示页面
pnpm build:demo

# 运行测试
pnpm test

# 运行测试UI
pnpm test:ui

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 修复代码格式
pnpm lint:fix

# 发布到npm
pnpm publish:npm
```

## 📚 示例项目

查看 `examples/` 目录中的完整示例：

- **`BasicUsage.tsx`** - 基础使用示例，展示最简单的播放器用法
- **`SocialActionsExample.tsx`** - 社交功能示例，包含点赞、收藏、分享功能
- **`CustomExtensionExample.tsx`** - 自定义扩展示例，展示如何添加自定义功能
- **`AdvancedEnginesExample.tsx`** - 高级引擎示例，展示不同视频源的使用
- **`ErrorHandlingExample.tsx`** - 错误处理示例，展示错误处理和重试机制

### 🚀 快速开始

1. 克隆项目：`git clone <repository-url>`
2. 安装依赖：`pnpm install`
3. 启动开发服务器：`pnpm dev`
4. 打开浏览器访问：`http://localhost:5173`

## 🤝 贡献

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 这个项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 报告问题

如果你发现了bug或有功能建议，请[创建一个Issue](https://github.com/your-repo/issues)。

### 开发指南

- 遵循现有的代码风格
- 添加适当的测试
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 [ISC](https://opensource.org/licenses/ISC) 许可证。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**如果这个项目对你有帮助，请给它一个 ⭐️！**
