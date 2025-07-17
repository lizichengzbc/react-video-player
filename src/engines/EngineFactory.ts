import { BaseEngine, EnhancedDetectionResult } from './base/BaseEngine';
import { HlsEngine } from './hls/HlsEngine';
import { DashEngine } from './dash/DashEngine';
import { NativeEngine } from './native/NativeEngine';
import { YouTubeEngine } from './youtube/YouTubeEngine';
import { VimeoEngine } from './vimeo/VimeoEngine';
import { WebRTCEngine } from './webrtc/WebRTCEngine';
import { engineDetectionCache } from '../utils/EngineDetectionCache';
import { LoadTestOptions } from '../utils/ActualLoadTester';
import { MimeTypeDetector } from '../utils/MimeTypeDetector';

export interface EngineSelectionOptions {
  useCache?: boolean;
  performLoadTest?: boolean;
  loadTestOptions?: LoadTestOptions;
  preferredEngines?: string[];
  fallbackToNative?: boolean;
}

export interface EngineSelectionResult {
  engine: BaseEngine;
  detectionResult: EnhancedDetectionResult;
  engineType: string;
}

export class EngineFactory {
  private static engines: Array<new (videoElement: HTMLVideoElement) => BaseEngine> = [YouTubeEngine, VimeoEngine, WebRTCEngine, HlsEngine, DashEngine, NativeEngine];
  
  // 引擎类型映射表（避免重复定义）
  private static readonly ENGINE_MAP: Record<string, new (videoElement: HTMLVideoElement) => BaseEngine> = {
    'youtube': YouTubeEngine,
    'vimeo': VimeoEngine,
    'webrtc': WebRTCEngine,
    'hls': HlsEngine,
    'dash': DashEngine,
    'native': NativeEngine
  };
  
  // URL模式检测规则（避免重复逻辑）
  private static readonly URL_PATTERNS = {
    youtube: (src: string) => src.includes('youtube.com') || src.includes('youtu.be'),
    vimeo: (src: string) => src.includes('vimeo.com'),
    webrtc: (src: string) => src.startsWith('webrtc:') || src.includes('protocol=webrtc'),
    hls: (src: string) => src.includes('.m3u8') || src.includes('/hls/'),
    dash: (src: string) => src.includes('.mpd') || src.includes('/dash/')
  };

  /**
   * 创建视频引擎（传统方法，保持向后兼容）
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @returns 视频引擎实例
   */
  static createEngine(src: string, videoElement: HTMLVideoElement): BaseEngine {
    return this.selectEngineByDetection(src, videoElement, null);
  }
  
  /**
   * 异步创建视频引擎（推荐使用）
   * 支持HTTP头检测，能更准确地处理没有文件扩展名的视频URL
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @param options 创建选项
   * @returns Promise<BaseEngine>
   */
  static async createEngineAsync(
    src: string, 
    videoElement: HTMLVideoElement,
    options: {
      useCache?: boolean;
      enableHeaderDetection?: boolean;
      timeout?: number;
    } = {}
  ): Promise<BaseEngine> {
    const { useCache = true, enableHeaderDetection = true, timeout = 3000 } = options;
    
    // 检查缓存
    if (useCache) {
      const cachedEngine = this.getCachedEngine(src, videoElement);
      if (cachedEngine) {
        return cachedEngine;
      }
    }
    
    // 异步MIME类型检测
    let mimeTypeInfo = null;
    if (enableHeaderDetection) {
      mimeTypeInfo = await this.detectMimeTypeWithTimeout(src, timeout);
    }
    
    const engine = this.selectEngineByDetection(src, videoElement, mimeTypeInfo);
    
    // 缓存成功的检测结果
    if (useCache && mimeTypeInfo) {
      this.cacheEngineResult(src, engine, mimeTypeInfo);
    }
    
    return engine;
  }
  
  /**
   * 增强的引擎选择方法
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @param options 选择选项
   * @returns Promise<EngineSelectionResult>
   */
  static async selectEngine(
    src: string, 
    videoElement: HTMLVideoElement, 
    options: EngineSelectionOptions = {}
  ): Promise<EngineSelectionResult> {
    const {
      useCache = true,
      performLoadTest = false,
      loadTestOptions = {},
      preferredEngines = [],
      fallbackToNative = true
    } = options;
    
    // 检查缓存中是否有引擎
    if (useCache) {
      const cachedEngine = this.getCachedEngine(src, videoElement);
      if (cachedEngine) {
        const cachedResult = engineDetectionCache.get(src)!;
        return {
          engine: cachedEngine,
          detectionResult: {
            canPlay: cachedResult.canPlay,
            confidence: cachedResult.confidence,
            engineType: cachedResult.engineType,
            reason: 'From cache'
          },
          engineType: cachedResult.engineType
        };
      }
    }
    
    // 按优先级排序引擎
    const sortedEngines = this.sortEnginesByPreference(preferredEngines);
    
    // 测试每个引擎
    const detectionResults: Array<{
      engine: BaseEngine;
      result: EnhancedDetectionResult;
      engineClass: new (videoElement: HTMLVideoElement) => BaseEngine;
    }> = [];
    
    for (const EngineClass of sortedEngines) {
      const engine = new EngineClass(videoElement);
      
      try {
        const detectionResult = await engine.enhancedDetection(src, {
          useCache,
          performLoadTest,
          loadTestOptions
        });
        
        detectionResults.push({
          engine,
          result: detectionResult,
          engineClass: EngineClass
        });
        
        // 如果找到高置信度的引擎，立即返回
        if (detectionResult.canPlay && detectionResult.confidence === 'high') {
          return {
            engine,
            detectionResult,
            engineType: detectionResult.engineType
          };
        }
      } catch (error) {
        console.warn(`Engine ${engine.getEngineType()} detection failed:`, error);
      }
    }
    
    // 选择最佳引擎
    const bestResult = this.selectBestEngine(detectionResults);
    
    if (bestResult) {
      return {
        engine: bestResult.engine,
        detectionResult: bestResult.result,
        engineType: bestResult.result.engineType
      };
    }
    
    // 如果没有找到合适的引擎，使用原生引擎作为后备
    if (fallbackToNative) {
      const nativeEngine = new NativeEngine(videoElement);
      const nativeResult = await nativeEngine.enhancedDetection(src, {
        useCache,
        performLoadTest: false // 原生引擎不需要加载测试
      });
      
      return {
        engine: nativeEngine,
        detectionResult: nativeResult,
        engineType: 'native'
      };
    }
    
    throw new Error('No suitable engine found for the video source');
  }
  

  
  /**
   * 从缓存中获取引擎实例
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @returns 缓存的引擎实例或null
   */
  private static getCachedEngine(src: string, videoElement: HTMLVideoElement): BaseEngine | null {
    const cached = engineDetectionCache.get(src);
    if (cached && cached.canPlay) {
      const EngineClass = this.getEngineClass(cached.engineType);
      return EngineClass ? new EngineClass(videoElement) : null;
    }
    return null;
  }
  
  /**
   * 异步检测MIME类型（带超时控制）
   * @param src 视频源URL
   * @param timeout 超时时间（毫秒）
   * @returns MIME类型信息或null
   */
  private static async detectMimeTypeWithTimeout(src: string, timeout: number) {
    try {
      const detectPromise = MimeTypeDetector.detect(src);
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Detection timeout')), timeout)
      );
      
      return await Promise.race([detectPromise, timeoutPromise]);
    } catch (error) {
      console.warn('MIME type detection failed, falling back to URL-based detection:', error);
      return null;
    }
  }
  
  /**
   * 缓存引擎检测结果
   * @param src 视频源URL
   * @param engine 引擎实例
   * @param mimeTypeInfo MIME类型信息
   */
  private static cacheEngineResult(src: string, engine: BaseEngine, mimeTypeInfo: any) {
    engineDetectionCache.set(src, {
      engineType: engine.getEngineType(),
      canPlay: true,
      confidence: mimeTypeInfo?.confidence || 'medium',
      mimeType: mimeTypeInfo?.mimeType || this.detectVideoType(src),
      timestamp: Date.now()
    });
  }
  
  /**
   * 统一的引擎选择逻辑
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @param mimeTypeInfo MIME类型信息（可选）
   * @returns 选择的引擎实例
   */
  private static selectEngineByDetection(
    src: string, 
    videoElement: HTMLVideoElement, 
    mimeTypeInfo: any
  ): BaseEngine {
    // 首先进行URL模式匹配
    const urlBasedEngine = this.getEngineByUrlPattern(src, videoElement);
    if (urlBasedEngine) {
      return urlBasedEngine;
    }
    
    // 确定MIME类型
    const detectedType = mimeTypeInfo?.mimeType || this.detectVideoType(src);
    
    // 根据检测到的类型选择引擎
    for (const EngineClass of this.engines) {
      const engine = new EngineClass(videoElement);
      
      if (engine.canPlayType(detectedType)) {
        if (this.validateBrowserSupport(detectedType, videoElement)) {
          return engine;
        }
      }
    }
    
    // 后备方案：尝试原始URL检测
    for (const EngineClass of this.engines) {
      const engine = new EngineClass(videoElement);
      if (engine.canPlayType(src)) {
        return engine;
      }
    }
    
    // 默认使用原生引擎
    return new NativeEngine(videoElement);
  }
  
  /**
   * 根据引擎类型获取引擎类
   * @param engineType 引擎类型
   * @returns 引擎类或null
   */
  private static getEngineClass(engineType: string): (new (videoElement: HTMLVideoElement) => BaseEngine) | null {
    return this.ENGINE_MAP[engineType] || null;
  }
  
  /**
   * 按优先级排序引擎
   * @param preferredEngines 优先引擎列表
   * @returns 排序后的引擎类数组
   */
  private static sortEnginesByPreference(preferredEngines: string[]): Array<new (videoElement: HTMLVideoElement) => BaseEngine> {
    if (preferredEngines.length === 0) {
      return this.engines;
    }
    
    const preferred = preferredEngines
      .map(engineType => this.ENGINE_MAP[engineType])
      .filter(Boolean);
    
    const remaining = this.engines.filter(engine => !preferred.includes(engine));
    
    return [...preferred, ...remaining];
  }
  
  /**
   * 选择最佳引擎
   * @param results 检测结果数组
   * @returns 最佳引擎结果或null
   */
  private static selectBestEngine(results: Array<{
    engine: BaseEngine;
    result: EnhancedDetectionResult;
    engineClass: new (videoElement: HTMLVideoElement) => BaseEngine;
  }>) {
    // 过滤出可播放的引擎
    const playableResults = results.filter(r => r.result.canPlay);
    
    if (playableResults.length === 0) {
      return null;
    }
    
    // 按置信度排序
    const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    
    playableResults.sort((a, b) => {
      const aConfidence = confidenceOrder[a.result.confidence];
      const bConfidence = confidenceOrder[b.result.confidence];
      
      if (aConfidence !== bConfidence) {
        return bConfidence - aConfidence; // 高置信度优先
      }
      
      // 如果置信度相同，按引擎优先级排序
      const aIndex = this.engines.indexOf(a.engineClass);
      const bIndex = this.engines.indexOf(b.engineClass);
      
      return aIndex - bIndex;
    });
    
    return playableResults[0];
  }

  /**
   * 根据URL模式快速匹配特定平台的引擎
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @returns 匹配的引擎实例或null
   */
  private static getEngineByUrlPattern(src: string, videoElement: HTMLVideoElement): BaseEngine | null {
    for (const [engineType, pattern] of Object.entries(this.URL_PATTERNS)) {
      if (pattern(src)) {
        const EngineClass = this.ENGINE_MAP[engineType];
        return EngineClass ? new EngineClass(videoElement) : null;
      }
    }
    return null;
  }
  
  /**
   * 验证浏览器对特定MIME类型的支持
   * @param mimeType MIME类型
   * @param videoElement 视频元素
   * @returns 是否支持
   */
  private static validateBrowserSupport(mimeType: string, videoElement: HTMLVideoElement): boolean {
    try {
      const support = videoElement.canPlayType(mimeType);
      return support === 'probably' || support === 'maybe';
    } catch {
      return false;
    }
  }
  
  // MIME类型映射表
  private static readonly MIME_TYPE_MAP: Record<string, string> = {
    youtube: 'video/youtube',
    vimeo: 'video/vimeo',
    webrtc: 'application/webrtc',
    hls: 'application/vnd.apple.mpegurl',
    dash: 'application/dash+xml'
  };
  
  // 文件扩展名映射表
  private static readonly EXTENSION_MAP: Record<string, string> = {
    'm3u8': 'application/vnd.apple.mpegurl',
    'mpd': 'application/dash+xml',
    'mp4': 'video/mp4',
    'm4v': 'video/mp4',
    'webm': 'video/webm',
    'ogv': 'video/ogg',
    'ogg': 'video/ogg',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv'
  };

  /**
   * 检测视频类型
   * @param src 视频源URL
   * @returns 检测到的MIME类型
   */
  static detectVideoType(src: string): string {
    // 特殊平台URL检测
    for (const [engineType, pattern] of Object.entries(this.URL_PATTERNS)) {
      if (pattern(src)) {
        return this.MIME_TYPE_MAP[engineType] || 'video/mp4';
      }
    }
    
    // 文件扩展名检测
    const cleanUrl = src.split('?')[0].split('#')[0];
    const extension = cleanUrl.split('.').pop()?.toLowerCase();
    
    if (extension && this.EXTENSION_MAP[extension]) {
      return this.EXTENSION_MAP[extension];
    }
    
    // 流媒体URL模式检测
    if (src.includes('stream') && src.includes('mp4')) return 'video/mp4';
    if (src.includes('stream') && src.includes('webm')) return 'video/webm';
    
    // 默认返回MP4
    return 'video/mp4';
  }
}