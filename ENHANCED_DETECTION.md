# 增强视频检测功能

本文档介绍了React Video Player中新增的增强视频检测功能，包括实际加载测试、MIME类型检测以及缓存和性能优化。

## 功能概述

### 1. 实际加载测试 (ActualLoadTester)

通过创建临时的video元素来实际测试视频源是否可以加载和播放。

```typescript
import { ActualLoadTester } from 'react-video-player';

const tester = new ActualLoadTester();

// 测试单个视频源
const result = await tester.testLoad('https://example.com/video.mp4', {
  timeout: 5000,
  checkPlayability: true
});

console.log(result.canLoad); // true/false
console.log(result.loadTime); // 加载时间(ms)

// 批量测试多个视频源
const sources = [
  'https://example.com/video1.mp4',
  'https://example.com/video2.webm'
];
const results = await tester.testMultipleSources(sources);
```

### 2. MIME类型检测 (MimeTypeDetector)

更准确地检测视频格式和编解码器支持。

```typescript
import { MimeTypeDetector } from 'react-video-player';

const detector = new MimeTypeDetector();

// 从URL检测MIME类型
const mimeInfo = detector.detectFromUrl('https://example.com/video.mp4');
console.log(mimeInfo.mimeType); // 'video/mp4'
console.log(mimeInfo.codecs); // ['avc1.42E01E', 'mp4a.40.2']

// 通过HTTP头检测
const headerInfo = await detector.detectFromHeaders('https://example.com/video.mp4');

// 检查浏览器支持
const isSupported = detector.checkBrowserSupport('video/mp4; codecs="avc1.42E01E"');
```

### 3. 缓存和性能优化 (EngineDetectionCache)

缓存检测结果以提高性能，避免重复检测。

```typescript
import { EngineDetectionCache } from 'react-video-player';

const cache = new EngineDetectionCache();

// 获取缓存的检测结果
const cached = cache.get('https://example.com/video.mp4');

// 设置缓存
cache.set('https://example.com/video.mp4', {
  canPlay: true,
  confidence: 0.9,
  engineType: 'native',
  detectionMethod: 'actual_load',
  timestamp: Date.now()
});

// 获取缓存统计
const stats = cache.getStats();
console.log(`缓存命中率: ${stats.hitRate}%`);
```

## 增强的引擎选择

### EngineFactory 增强功能

```typescript
import { EngineFactory } from 'react-video-player';

const factory = new EngineFactory();

// 使用增强检测选择引擎
const result = await factory.selectEngine('https://example.com/video.mp4', {
  enableActualLoad: true,
  enableMimeDetection: true,
  enableCaching: true,
  timeout: 5000,
  preferredEngines: ['hls', 'native']
});

console.log(result.selectedEngine); // 选中的引擎实例
console.log(result.confidence); // 置信度
console.log(result.detectionResults); // 所有引擎的检测结果

// 快速选择（仅使用缓存和基础检测）
const quickResult = await factory.quickSelectEngine('https://example.com/video.mp4');
```

### BaseEngine 增强检测

所有引擎现在都支持增强检测：

```typescript
import { NativeEngine } from 'react-video-player';

const engine = new NativeEngine(videoElement);

// 增强检测（包含实际加载测试）
const result = await engine.enhancedDetection('https://example.com/video.mp4', {
  enableActualLoad: true,
  enableMimeDetection: true,
  timeout: 5000
});

// 快速检测（仅基础检测）
const quickResult = await engine.quickDetection('https://example.com/video.mp4');
```

## 配置选项

### LoadTestOptions

```typescript
interface LoadTestOptions {
  timeout?: number;           // 超时时间(ms)，默认10000
  checkPlayability?: boolean; // 是否检查可播放性，默认false
  preload?: string;          // 预加载策略，默认'metadata'
  crossOrigin?: string;      // 跨域设置
  volume?: number;           // 音量设置，默认0
}
```

### EngineSelectionOptions

```typescript
interface EngineSelectionOptions {
  enableActualLoad?: boolean;    // 启用实际加载测试
  enableMimeDetection?: boolean; // 启用MIME类型检测
  enableCaching?: boolean;       // 启用缓存
  timeout?: number;              // 超时时间
  preferredEngines?: string[];   // 首选引擎列表
  loadTestOptions?: LoadTestOptions; // 加载测试选项
}
```

## 性能优化建议

1. **启用缓存**: 对于相同的视频源，缓存可以显著提高检测速度
2. **合理设置超时**: 根据网络环境调整超时时间
3. **选择性启用功能**: 根据需要选择启用实际加载测试
4. **批量检测**: 对于多个视频源，使用批量检测可以提高效率

## 示例组件

查看 `EnhancedDetectionExample.tsx` 文件了解完整的使用示例。

## 注意事项

1. 实际加载测试会消耗网络带宽，建议在必要时使用
2. 缓存会占用内存，定期清理过期缓存
3. 跨域视频可能无法进行某些检测，需要适当的CORS设置
4. 某些视频格式可能需要特定的浏览器支持