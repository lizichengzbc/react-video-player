/**
 * 实际加载测试工具
 * 通过创建临时video元素进行真实的加载测试
 * 集成了增强功能：重试机制、安全检查、队列管理等
 */

// 基础接口（保持向后兼容）
export interface LoadTestResult {
  canLoad: boolean;
  loadTime: number;
  error?: string;
  networkState?: number;
  readyState?: number;
  duration?: number;
  videoWidth?: number;
  videoHeight?: number;
}

export interface LoadTestOptions {
  timeout?: number; // 超时时间，默认5秒
  preload?: 'none' | 'metadata' | 'auto'; // 预加载策略，默认metadata
  crossOrigin?: 'anonymous' | 'use-credentials' | null; // 跨域设置
  muted?: boolean; // 是否静音，默认true
}

// 增强接口
export interface EnhancedLoadTestOptions extends LoadTestOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxFileSize?: number;
  trustedDomains?: string[];
  enableSecurityCheck?: boolean;
}

export interface NetworkInfo {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
}

export interface EnhancedLoadTestResult extends LoadTestResult {
  retryCount?: number;
  securityCheck?: {
    passed: boolean;
    issues?: string[];
  };
  networkInfo?: NetworkInfo;
}

export class ActualLoadTester {
  private static readonly DEFAULT_OPTIONS: Required<LoadTestOptions> = {
    timeout: 5000,
    preload: 'metadata',
    crossOrigin: 'anonymous',
    muted: true
  };

  private static readonly ENHANCED_DEFAULT_OPTIONS: Required<EnhancedLoadTestOptions> = {
    ...ActualLoadTester.DEFAULT_OPTIONS,
    maxRetries: 2,
    retryDelay: 1000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    trustedDomains: [],
    enableSecurityCheck: true
  };

  private static activeTests = new Set<string>();
  private static testQueue: Array<{ src: string; resolve: (value: EnhancedLoadTestResult) => void; reject: (reason?: any) => void }> = [];
  private static readonly MAX_CONCURRENT_TESTS = 3;

  /**
   * 基础测试方法（向后兼容）
   */
  static async testLoad(src: string, options: LoadTestOptions = {}): Promise<LoadTestResult> {
    const result = await this.enhancedTestLoad(src, {
      ...options,
      maxRetries: 0, // 基础版本不重试
      enableSecurityCheck: false // 基础版本不进行安全检查
    });

    // 返回基础结果格式
    return {
      canLoad: result.canLoad,
      loadTime: result.loadTime,
      error: result.error,
      networkState: result.networkState,
      readyState: result.readyState,
      duration: result.duration,
      videoWidth: result.videoWidth,
      videoHeight: result.videoHeight
    };
  }

  /**
   * 增强测试方法
   */
  static async enhancedTestLoad(
    src: string, 
    options: EnhancedLoadTestOptions = {}
  ): Promise<EnhancedLoadTestResult> {
    const opts = { ...this.ENHANCED_DEFAULT_OPTIONS, ...options };
    
    // 检查是否应该进行实际测试
    if (!this.shouldPerformActualTest()) {
      return {
        canLoad: false,
        loadTime: 0,
        error: 'Actual load test skipped due to network/device conditions',
        networkInfo: this.getNetworkInfo()
      };
    }

    // 安全检查
    let securityCheck: { passed: boolean; issues: string[] } | undefined;
    if (opts.enableSecurityCheck) {
      securityCheck = await this.performSecurityCheck(src, opts);
      if (!securityCheck.passed) {
        return {
          canLoad: false,
          loadTime: 0,
          error: `Security check failed: ${securityCheck.issues.join(', ')}`,
          securityCheck,
          networkInfo: this.getNetworkInfo()
        };
      }
    }

    // 使用队列管理并发测试
    return this.queueTest(src, async () => {
      let lastResult: EnhancedLoadTestResult;
      
      for (let retryCount = 0; retryCount <= opts.maxRetries; retryCount++) {
        try {
          const result = await this.performSingleTest(src, opts, retryCount);
          
          if (result.canLoad || retryCount === opts.maxRetries) {
            return {
              ...result,
              securityCheck
            };
          }
          
          lastResult = result;
          
          // 等待后重试
          if (retryCount < opts.maxRetries) {
            await new Promise(resolve => 
              setTimeout(resolve, opts.retryDelay * (retryCount + 1))
            );
          }
        } catch (error) {
          lastResult = {
            canLoad: false,
            loadTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount,
            networkInfo: this.getNetworkInfo()
          };
        }
      }
      
      return {
        ...lastResult!,
        error: `Failed after ${opts.maxRetries + 1} attempts: ${lastResult!.error}`,
        securityCheck
      };
    });
  }

  /**
   * 批量测试多个视频源
   */
  static async testMultipleSources(
    sources: string[], 
    options: LoadTestOptions = {}
  ): Promise<Map<string, LoadTestResult>> {
    const results = new Map<string, LoadTestResult>();
    
    // 分批处理，避免资源耗尽
    const batchSize = Math.min(this.MAX_CONCURRENT_TESTS, 3);
    
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      
      const promises = batch.map(async (src) => {
        try {
          const result = await this.testLoad(src, options);
          results.set(src, result);
        } catch (error) {
          results.set(src, {
            canLoad: false,
            loadTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
      
      await Promise.all(promises);
      
      // 批次间短暂延迟
      if (i + batchSize < sources.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * 快速测试
   */
  static async quickTest(src: string, timeout: number = 2000): Promise<boolean> {
    try {
      const result = await this.testLoad(src, {
        timeout,
        preload: 'none'
      });
      return result.canLoad;
    } catch {
      return false;
    }
  }

  // 私有方法
  private static shouldPerformActualTest(): boolean {
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.effectiveType === '2g' || connection.saveData) {
        return false;
      }
    }

    if (document.visibilityState !== 'visible') {
      return false;
    }

    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory < 2) {
      return false;
    }

    return true;
  }

  private static getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection;
    if (!connection) return {};

    return {
      effectiveType: connection.effectiveType,
      saveData: connection.saveData,
      downlink: connection.downlink
    };
  }

  private static async performSecurityCheck(
    src: string, 
    options: EnhancedLoadTestOptions
  ): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const url = new URL(src);

      if (!['http:', 'https:'].includes(url.protocol)) {
        issues.push('Unsupported protocol');
      }

      if (options.trustedDomains && options.trustedDomains.length > 0) {
        const isDomainTrusted = options.trustedDomains.some(domain => 
          url.hostname.endsWith(domain)
        );
        if (!isDomainTrusted) {
          issues.push('Untrusted domain');
        }
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(src, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const size = parseInt(contentLength);
          if (size > (options.maxFileSize || this.ENHANCED_DEFAULT_OPTIONS.maxFileSize)) {
            issues.push('File too large');
          }
        }

        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('video/') && !contentType.includes('stream')) {
          issues.push('Invalid content type');
        }
      } catch (error) {
        console.warn('HEAD request failed:', error);
      }

    } catch {
      issues.push('Invalid URL format');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  private static async queueTest<T>(
    src: string,
    testFunction: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeTest = async () => {
        try {
          this.activeTests.add(src);
          const result = await testFunction();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeTests.delete(src);
          this.processQueue();
        }
      };

      if (this.activeTests.size < this.MAX_CONCURRENT_TESTS) {
        executeTest();
      } else {
        this.testQueue.push({ src, resolve: executeTest, reject });
      }
    });
  }

  private static processQueue(): void {
    while (this.testQueue.length > 0 && this.activeTests.size < this.MAX_CONCURRENT_TESTS) {
      const { resolve } = this.testQueue.shift()!;
      resolve();
    }
  }

  private static async performSingleTest(
    src: string,
    options: EnhancedLoadTestOptions,
    retryCount: number = 0
  ): Promise<EnhancedLoadTestResult> {
    const opts = { ...this.ENHANCED_DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();
    
    return new Promise<EnhancedLoadTestResult>((resolve) => {
      const video = document.createElement('video');
      let resolved = false;
      
      video.preload = opts.preload;
      video.muted = opts.muted;
      video.crossOrigin = opts.crossOrigin;
      
      video.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        z-index: -1;
      `;
      
      const timeoutDuration = opts.timeout * (retryCount + 1);
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            canLoad: false,
            loadTime: performance.now() - startTime,
            error: `Load test timeout after ${timeoutDuration}ms`,
            networkState: video.networkState,
            readyState: video.readyState,
            retryCount,
            networkInfo: this.getNetworkInfo()
          });
        }
      }, timeoutDuration);
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        
        ['loadedmetadata', 'canplay', 'error', 'abort', 'stalled', 'loadstart'].forEach(event => {
          video.removeEventListener(event, handlers[event as keyof typeof handlers]);
        });
        
        try {
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        } catch (error) {
          console.warn('Failed to remove video element:', error);
        }
        
        try {
          video.src = '';
          video.load();
        } catch (error) {
          console.warn('Failed to cleanup video resources:', error);
        }
      };
      
      const handlers = {
        loadedmetadata: () => {
          if (!resolved) {
            resolved = true;
            const loadTime = performance.now() - startTime;
            
            cleanup();
            resolve({
              canLoad: true,
              loadTime,
              networkState: video.networkState,
              readyState: video.readyState,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              retryCount,
              networkInfo: this.getNetworkInfo()
            });
          }
        },
        
        canplay: () => {
          if (!resolved && opts.preload === 'auto') {
            resolved = true;
            const loadTime = performance.now() - startTime;
            
            cleanup();
            resolve({
              canLoad: true,
              loadTime,
              networkState: video.networkState,
              readyState: video.readyState,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              retryCount,
              networkInfo: this.getNetworkInfo()
            });
          }
        },
        
        error: () => {
          if (!resolved) {
            resolved = true;
            const loadTime = performance.now() - startTime;
            let errorMessage = 'Unknown error';
            
            if (video.error) {
              const errorMessages = {
                [MediaError.MEDIA_ERR_ABORTED]: 'Media loading aborted',
                [MediaError.MEDIA_ERR_NETWORK]: 'Network error',
                [MediaError.MEDIA_ERR_DECODE]: 'Media decode error',
                [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: 'Media format not supported'
              };
              
              errorMessage = errorMessages[video.error.code] || 
                           video.error.message || 
                           'Unknown media error';
            }
            
            cleanup();
            resolve({
              canLoad: false,
              loadTime,
              error: errorMessage,
              networkState: video.networkState,
              readyState: video.readyState,
              retryCount,
              networkInfo: this.getNetworkInfo()
            });
          }
        },
        
        abort: () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve({
              canLoad: false,
              loadTime: performance.now() - startTime,
              error: 'Load aborted',
              networkState: video.networkState,
              readyState: video.readyState,
              retryCount,
              networkInfo: this.getNetworkInfo()
            });
          }
        },
        
        stalled: () => {
          console.warn(`Video load stalled for: ${src} (attempt ${retryCount + 1})`);
        },
        
        loadstart: () => {
          console.debug(`Video load started for: ${src}`);
        }
      };
      
      Object.entries(handlers).forEach(([event, handler]) => {
        video.addEventListener(event, handler);
      });
      
      document.body.appendChild(video);
      
      try {
        video.src = src;
        video.load();
      } catch (error) {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            canLoad: false,
            loadTime: performance.now() - startTime,
            error: error instanceof Error ? error.message : 'Failed to set video source',
            retryCount,
            networkInfo: this.getNetworkInfo()
          });
        }
      }
    });
  }

  /**
   * 获取当前测试统计信息
   */
  static getTestStats() {
    return {
      activeTests: this.activeTests.size,
      queuedTests: this.testQueue.length,
      maxConcurrentTests: this.MAX_CONCURRENT_TESTS
    };
  }

  /**
   * 清理所有待处理的测试
   */
  static clearQueue(): void {
    this.testQueue.forEach(({ reject }) => {
      reject(new Error('Test queue cleared'));
    });
    this.testQueue.length = 0;
  }
}