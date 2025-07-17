import { BaseEngine, EnhancedDetectionResult } from './base/BaseEngine';
import { HlsEngine } from './hls/HlsEngine';
import { DashEngine } from './dash/DashEngine';
import { NativeEngine } from './native/NativeEngine';
import { YouTubeEngine } from './youtube/YouTubeEngine';
import { VimeoEngine } from './vimeo/VimeoEngine';
import { WebRTCEngine } from './webrtc/WebRTCEngine';
import { MimeTypeDetector } from '../utils/MimeTypeDetector';
import { engineDetectionCache } from '../utils/EngineDetectionCache';
import { LoadTestOptions } from '../utils/ActualLoadTester';

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
  private static engines = [YouTubeEngine, VimeoEngine, WebRTCEngine, HlsEngine, DashEngine, NativeEngine];

  /**
   * 创建视频引擎（传统方法，保持向后兼容）
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @returns 视频引擎实例
   */
  static createEngine(src: string, videoElement: HTMLVideoElement): BaseEngine {
    // 根据URL或MIME类型选择合适的引擎
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
    
    // 检查缓存中是否有最佳引擎
    if (useCache) {
      const cachedResult = this.getCachedBestEngine(src);
      if (cachedResult) {
        const EngineClass = this.getEngineClass(cachedResult.engineType);
        if (EngineClass) {
          const engine = new EngineClass(videoElement);
          return {
            engine,
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
    }
    
    // 按优先级排序引擎
    const sortedEngines = this.sortEnginesByPreference(preferredEngines);
    
    // 测试每个引擎
    const detectionResults: Array<{
      engine: BaseEngine;
      result: EnhancedDetectionResult;
      engineClass: typeof BaseEngine;
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
   * 快速引擎选择（仅基础检测）
   * @param src 视频源URL
   * @param videoElement 视频元素
   * @returns Promise<BaseEngine>
   */
  static async quickSelectEngine(src: string, videoElement: HTMLVideoElement): Promise<BaseEngine> {
    // 检查缓存
    const cachedResult = this.getCachedBestEngine(src);
    if (cachedResult) {
      const EngineClass = this.getEngineClass(cachedResult.engineType);
      if (EngineClass) {
        return new EngineClass(videoElement);
      }
    }
    
    // 快速检测
    for (const EngineClass of this.engines) {
      const engine = new EngineClass(videoElement);
      const canPlay = await engine.quickDetection(src);
      
      if (canPlay) {
        return engine;
      }
    }
    
    // 默认使用原生引擎
    return new NativeEngine(videoElement);
  }
  
  /**
   * 从缓存中获取最佳引擎
   * @param src 视频源URL
   * @returns 缓存的检测结果或null
   */
  private static getCachedBestEngine(src: string) {
    const cached = engineDetectionCache.get(src);
    return cached && cached.canPlay ? cached : null;
  }
  
  /**
   * 根据引擎类型获取引擎类
   * @param engineType 引擎类型
   * @returns 引擎类或null
   */
  private static getEngineClass(engineType: string): typeof BaseEngine | null {
    const engineMap: Record<string, typeof BaseEngine> = {
      'youtube': YouTubeEngine,
      'vimeo': VimeoEngine,
      'webrtc': WebRTCEngine,
      'hls': HlsEngine,
      'dash': DashEngine,
      'native': NativeEngine
    };
    
    return engineMap[engineType] || null;
  }
  
  /**
   * 按优先级排序引擎
   * @param preferredEngines 优先引擎列表
   * @returns 排序后的引擎类数组
   */
  private static sortEnginesByPreference(preferredEngines: string[]): Array<typeof BaseEngine> {
    if (preferredEngines.length === 0) {
      return this.engines;
    }
    
    const engineMap: Record<string, typeof BaseEngine> = {
      'youtube': YouTubeEngine,
      'vimeo': VimeoEngine,
      'webrtc': WebRTCEngine,
      'hls': HlsEngine,
      'dash': DashEngine,
      'native': NativeEngine
    };
    
    const preferred: Array<typeof BaseEngine> = [];
    const remaining: Array<typeof BaseEngine> = [];
    
    // 添加优先引擎
    for (const engineType of preferredEngines) {
      const EngineClass = engineMap[engineType];
      if (EngineClass) {
        preferred.push(EngineClass);
      }
    }
    
    // 添加剩余引擎
    for (const EngineClass of this.engines) {
      if (!preferred.includes(EngineClass)) {
        remaining.push(EngineClass);
      }
    }
    
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
    engineClass: typeof BaseEngine;
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

  static detectVideoType(src: string): string {
    if (src.includes('youtube.com') || src.includes('youtu.be')) return 'youtube';
    if (src.includes('vimeo.com')) return 'vimeo';
    if (src.startsWith('webrtc:') || src.includes('protocol=webrtc')) return 'application/webrtc';
    if (src.includes('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (src.includes('.mpd')) return 'application/dash+xml';
    if (src.includes('.mp4')) return 'video/mp4';
    if (src.includes('.webm')) return 'video/webm';
    return 'video/mp4'; // 默认
  }
}