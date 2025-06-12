// 主要组件导出
export { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
export type { VideoPlayerProps } from './components/VideoPlayer/VideoPlayer';

// 控件组件导出
export { VideoControls } from './components/Controls/VideoControls';
export type { VideoControlsProps } from './components/Controls/VideoControls';

// 错误覆盖层组件导出
export { ErrorOverlay } from './components/VideoPlayer/ErrorOverlay';
export type { ErrorOverlayProps } from './components/VideoPlayer/ErrorOverlay';

// 引擎相关导出
export { BaseEngine } from './engines/base/BaseEngine';
export { EngineFactory } from './engines/EngineFactory';
export { HlsEngine } from './engines/hls/HlsEngine';
export { DashEngine } from './engines/dash/DashEngine';
export { NativeEngine } from './engines/native/NativeEngine';
export { YouTubeEngine } from './engines/youtube/YouTubeEngine';
export { VimeoEngine } from './engines/vimeo/VimeoEngine';
export { WebRTCEngine } from './engines/webrtc/WebRTCEngine';

// 类型定义导出
export type {
  VideoSource,
  VideoPlayerState,
  VideoPlayerConfig
} from './types/index';

// 引擎事件类型导出
export type { VideoEngineEvents } from './engines/base/BaseEngine';

// 默认导出主组件
export { VideoPlayer as default } from './components/VideoPlayer/VideoPlayer';