# Changelog

所有对此项目的重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且此项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 🚀 **引擎选择机制重大改进**：
  - 新增 `createEngineAsync()` 异步方法，支持HTTP头检测
  - 多层检测机制：URL模式 + 文件扩展名 + HTTP头信息
  - 浏览器支持验证：确保选择的引擎真正被浏览器支持
  - 智能缓存机制：避免重复检测，提高性能
  - 超时控制：防止网络检测阻塞
  - 后备机制：多重后备策略确保总能找到可用引擎
- ✨ **改进的MIME类型检测**：
  - 支持更多视频格式的扩展名映射
  - URL清理：正确处理查询参数和片段标识符
  - 模式检测：处理无扩展名的流媒体URL
- 📚 **新增文档和示例**：
  - 详细的引擎选择改进说明文档
  - 交互式示例组件 `ImprovedEngineSelection.tsx`
  - 最佳实践和使用建议

### Changed
- 🔧 **EngineFactory.createEngine()** 方法改进：
  - 保持向后兼容的同时增强检测能力
  - 优化检测顺序，提高性能
  - 增强错误处理和降级策略
- 🎯 **EngineFactory.detectVideoType()** 方法重构：
  - 更准确的MIME类型检测
  - 支持更多视频格式
  - 改进的URL解析逻辑

### Fixed
- 🐛 修复无文件扩展名的视频URL检测问题
- 🐛 修复带查询参数的URL解析错误
- 🐛 改进特殊平台URL的识别准确性

### 计划中的功能
- 添加更多视频格式支持
- 性能优化
- 更多自定义选项

## [1.0.0] - 2024-01-01

### Added
- 🎉 初始版本发布
- ✨ 支持多种视频引擎：
  - 原生 HTML5 Video
  - HLS (HTTP Live Streaming) 支持
  - DASH (Dynamic Adaptive Streaming) 支持
  - YouTube 视频支持
  - Vimeo 视频支持
  - WebRTC 实时流支持
- 🎨 完全可自定义的 UI 组件
- 🎛️ 丰富的控制选项：
  - 播放/暂停控制
  - 进度条
  - 音量控制
  - 全屏支持
  - 错误处理和重试机制
- 📱 响应式设计，支持移动端
- 🔧 TypeScript 完整类型定义
- 🧪 完整的测试覆盖
- 📚 详细的文档和使用示例
- 🚀 支持 ES 模块和 UMD 格式
- 🎯 Tree-shaking 友好
- ⚡ 性能优化：
  - 懒加载支持
  - 内存泄漏防护
  - 事件节流优化
- 🔒 安全特性：
  - CSP (Content Security Policy) 兼容
  - CORS 支持
  - 输入验证
- 🌐 浏览器兼容性：
  - Chrome 60+
  - Firefox 55+
  - Safari 12+
  - Edge 79+

### Technical Details
- 基于 React 18+ 和 TypeScript 5+
- 使用 Vite 构建工具
- 集成 Ant Design 组件库
- 支持 hls.js 和 dash.js 流媒体库
- 完整的 CI/CD 流程
- 自动化测试和代码质量检查

### Documentation
- 📖 完整的 README 文档
- 🎓 基础知识指南
- 📋 发布指南
- 💡 使用示例和最佳实践
- 🔧 API 参考文档

### Development Experience
- 🛠️ 完整的开发环境配置
- 🧹 ESLint 和 Prettier 代码规范
- 🧪 Vitest 测试框架
- 📊 测试覆盖率报告
- 🚀 GitHub Actions CI/CD
- 📦 自动化 npm 发布流程

---

## 版本说明

### 版本格式
- **MAJOR.MINOR.PATCH** (例如: 1.0.0)
- **MAJOR**: 不兼容的 API 更改
- **MINOR**: 向后兼容的功能添加
- **PATCH**: 向后兼容的错误修复

### 变更类型
- `Added` - 新功能
- `Changed` - 现有功能的更改
- `Deprecated` - 即将移除的功能
- `Removed` - 已移除的功能
- `Fixed` - 错误修复
- `Security` - 安全相关的修复

### 图标说明
- 🎉 重大发布
- ✨ 新功能
- 🎨 UI/样式改进
- 🐛 错误修复
- 📚 文档更新
- 🚀 性能改进
- 🔧 配置/工具更新
- 🧪 测试相关
- 📱 移动端改进
- 🔒 安全改进
- ⚡ 性能优化
- 🌐 国际化/本地化