import { MimeTypeDetector, MimeTypeInfo } from '../../utils/MimeTypeDetector';
import { ActualLoadTester, LoadTestResult, LoadTestOptions } from '../../utils/ActualLoadTester';
import { engineDetectionCache, DetectionResult } from '../../utils/EngineDetectionCache';

export interface VideoEngineEvents {
  loadstart: () => void;
  loadedmetadata: () => void;
  canplay: () => void;
  play: () => void;
  pause: () => void;
  ended: () => void;
  error: (error: Error) => void;
  timeupdate: (currentTime: number) => void;
  progress: (buffered: TimeRanges) => void;
}

export interface EnhancedDetectionResult {
  canPlay: boolean;
  confidence: 'high' | 'medium' | 'low';
  mimeTypeInfo?: MimeTypeInfo;
  loadTestResult?: LoadTestResult;
  engineType: string;
  reason?: string;
}

export abstract class BaseEngine {
  protected videoElement: HTMLVideoElement;
  protected eventListeners: Map<string, Function[]> = new Map();

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.setupEventListeners();
  }

  // 抽象方法，子类必须实现
  abstract load(src: string): Promise<void>;
  abstract destroy(): void;
  abstract canPlayType(type: string): boolean;
  
  // 获取引擎类型名称
  abstract getEngineType(): string;
  
  /**
   * 增强的检测方法，结合多种检测策略
   * @param src 视频源URL
   * @param options 检测选项
   * @returns Promise<EnhancedDetectionResult>
   */
  async enhancedDetection(
    src: string, 
    options: { 
      useCache?: boolean;
      performLoadTest?: boolean;
      loadTestOptions?: LoadTestOptions;
    } = {}
  ): Promise<EnhancedDetectionResult> {
    const { useCache = true, performLoadTest = false, loadTestOptions = {} } = options;
    
    // 检查缓存
    if (useCache) {
      const cached = engineDetectionCache.get(src);
      if (cached && cached.engineType === this.getEngineType()) {
        return {
          canPlay: cached.canPlay,
          confidence: cached.confidence,
          engineType: cached.engineType,
          reason: 'From cache'
        };
      }
    }
    
    // MIME类型检测
    const mimeTypeInfo = await MimeTypeDetector.detect(src);
    
    // 基础类型检测
    const basicCanPlay = mimeTypeInfo ? this.canPlayType(mimeTypeInfo.mimeType) : false;
    
    let result: EnhancedDetectionResult = {
      canPlay: basicCanPlay,
      confidence: basicCanPlay ? 'medium' : 'low',
      mimeTypeInfo,
      engineType: this.getEngineType(),
      reason: 'Basic type detection'
    };
    
    // 浏览器支持检测
    if (mimeTypeInfo && basicCanPlay) {
      const browserSupport = MimeTypeDetector.checkBrowserSupport(mimeTypeInfo);
      if (browserSupport === 'probably') {
        result.confidence = 'high';
        result.reason = 'Browser probably supports';
      } else if (browserSupport === 'maybe') {
        result.confidence = 'medium';
        result.reason = 'Browser maybe supports';
      }
    }
    
    // 实际加载测试（可选）
    if (performLoadTest && basicCanPlay) {
      try {
        const loadTestResult = await ActualLoadTester.testLoad(src, {
          timeout: 3000,
          preload: 'metadata',
          ...loadTestOptions
        });
        
        result.loadTestResult = loadTestResult;
        
        if (loadTestResult.canLoad) {
          result.canPlay = true;
          result.confidence = 'high';
          result.reason = 'Actual load test passed';
        } else {
          result.canPlay = false;
          result.confidence = 'low';
          result.reason = `Load test failed: ${loadTestResult.error}`;
        }
      } catch (error) {
        result.reason = `Load test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    // 缓存结果
    if (useCache) {
      const cacheResult: DetectionResult = {
        engineType: this.getEngineType(),
        canPlay: result.canPlay,
        confidence: result.confidence,
        mimeType: mimeTypeInfo?.mimeType,
        timestamp: Date.now()
      };
      engineDetectionCache.set(src, cacheResult);
    }
    
    return result;
  }
  
  /**
   * 快速检测方法，仅进行基础检测
   * @param src 视频源URL
   * @returns Promise<boolean>
   */
  async quickDetection(src: string): Promise<boolean> {
    // 检查缓存
    const cached = engineDetectionCache.get(src);
    if (cached && cached.engineType === this.getEngineType()) {
      return cached.canPlay;
    }
    
    // MIME类型检测
    const mimeTypeInfo = await MimeTypeDetector.detect(src);
    const canPlay = mimeTypeInfo ? this.canPlayType(mimeTypeInfo.mimeType) : false;
    
    // 缓存结果
    const cacheResult: DetectionResult = {
      engineType: this.getEngineType(),
      canPlay,
      confidence: canPlay ? 'medium' : 'low',
      mimeType: mimeTypeInfo?.mimeType,
      timestamp: Date.now()
    };
    engineDetectionCache.set(src, cacheResult);
    
    return canPlay;
  }

  // 通用播放控制方法
  play(): Promise<void> {
    return this.videoElement.play();
  }

  pause(): void {
    this.videoElement.pause();
  }

  seek(time: number): void {
    this.videoElement.currentTime = time;
  }

  setVolume(volume: number): void {
    this.videoElement.volume = Math.max(0, Math.min(1, volume));
  }

  // 事件管理
  on<K extends keyof VideoEngineEvents>(event: K, callback: VideoEngineEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off<K extends keyof VideoEngineEvents>(event: K, callback: VideoEngineEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  protected emit<K extends keyof VideoEngineEvents>(event: K, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  private setupEventListeners(): void {
    this.videoElement.addEventListener('loadstart', () => this.emit('loadstart'));
    this.videoElement.addEventListener('loadedmetadata', () => this.emit('loadedmetadata'));
    this.videoElement.addEventListener('canplay', () => this.emit('canplay'));
    this.videoElement.addEventListener('play', () => this.emit('play'));
    this.videoElement.addEventListener('pause', () => this.emit('pause'));
    this.videoElement.addEventListener('ended', () => this.emit('ended'));
    this.videoElement.addEventListener('error', (e) => this.emit('error', new Error('Video error')));
    this.videoElement.addEventListener('timeupdate', () => this.emit('timeupdate', this.videoElement.currentTime));
    this.videoElement.addEventListener('progress', () => this.emit('progress', this.videoElement.buffered));
  }
}