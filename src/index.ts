// 主要组件导出
export { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
export type { VideoPlayerProps } from './components/VideoPlayer/VideoPlayer';

// 控件组件导出
export { VideoControls } from './components/Controls/VideoControls';
export type { VideoControlsProps } from './components/Controls/VideoControls';

// 错误覆盖层组件导出
export { ErrorOverlay } from './components/VideoPlayer/ErrorOverlay';
export type { ErrorOverlayProps } from './components/VideoPlayer/ErrorOverlay';

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