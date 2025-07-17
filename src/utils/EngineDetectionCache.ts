/**
 * 引擎检测缓存工具类
 * 用于缓存视频源的检测结果，避免重复检测提升性能
 */
export interface DetectionResult {
  engineType: string;
  canPlay: boolean;
  confidence: 'high' | 'medium' | 'low';
  mimeType?: string;
  timestamp: number;
}

export class EngineDetectionCache {
  private cache = new Map<string, DetectionResult>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存时间
  private readonly MAX_CACHE_SIZE = 100; // 最大缓存条目数

  /**
   * 获取缓存的检测结果
   * @param src 视频源URL
   * @returns 缓存的检测结果或null
   */
  get(src: string): DetectionResult | null {
    const cached = this.cache.get(src);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    
    // 清理过期缓存
    if (cached) {
      this.cache.delete(src);
    }
    
    return null;
  }

  /**
   * 设置检测结果缓存
   * @param src 视频源URL
   * @param result 检测结果
   */
  set(src: string, result: DetectionResult): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(src, {
      ...result,
      timestamp: Date.now()
    });
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL
    };
  }
}

// 全局缓存实例
export const engineDetectionCache = new EngineDetectionCache();

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  // 每5分钟清理一次过期缓存
  setInterval(() => {
    engineDetectionCache.cleanup();
  }, 5 * 60 * 1000);
}