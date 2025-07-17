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
  VideoPlayerConfig,
  VideoPlayerControls
} from './types';

// 引擎事件类型导出
export type { VideoEngineEvents } from './engines/base/BaseEngine';

// 引擎工厂导出
export { EngineFactory } from './engines/EngineFactory';
export type { 
  EngineSelectionOptions, 
  EngineSelectionResult 
} from './engines/EngineFactory';

// 检测工具导出
export { MimeTypeDetector } from './utils/MimeTypeDetector';
export type { MimeTypeInfo } from './utils/MimeTypeDetector';

export { ActualLoadTester } from './utils/ActualLoadTester';
export type { 
  LoadTestResult, 
  LoadTestOptions,
  EnhancedLoadTestResult, 
  EnhancedLoadTestOptions,
  NetworkInfo 
} from './utils/ActualLoadTester';

export { EngineDetectionCache } from './utils/EngineDetectionCache';
export type { DetectionResult } from './utils/EngineDetectionCache';

// 增强检测结果类型导出
export type { EnhancedDetectionResult } from './engines/base/BaseEngine';

// 默认导出主组件
export { VideoPlayer as default } from './components/VideoPlayer/VideoPlayer';