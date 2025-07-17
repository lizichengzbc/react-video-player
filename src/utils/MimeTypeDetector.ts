/**
 * MIME类型检测工具
 * 用于检测视频文件的MIME类型和编解码器支持
 */
export interface MimeTypeInfo {
  mimeType: string;
  codecs?: string[];
  container: string;
  confidence: 'high' | 'medium' | 'low';
}

export class MimeTypeDetector {
  private static readonly MIME_TYPE_MAP: Record<string, MimeTypeInfo> = {
    // MP4 容器
    'mp4': {
      mimeType: 'video/mp4',
      codecs: ['avc1.42E01E', 'mp4a.40.2'],
      container: 'mp4',
      confidence: 'high'
    },
    'm4v': {
      mimeType: 'video/mp4',
      codecs: ['avc1.42E01E', 'mp4a.40.2'],
      container: 'mp4',
      confidence: 'high'
    },
    // WebM 容器
    'webm': {
      mimeType: 'video/webm',
      codecs: ['vp8', 'vorbis'],
      container: 'webm',
      confidence: 'high'
    },
    // OGG 容器
    'ogv': {
      mimeType: 'video/ogg',
      codecs: ['theora', 'vorbis'],
      container: 'ogg',
      confidence: 'high'
    },
    'ogg': {
      mimeType: 'video/ogg',
      codecs: ['theora', 'vorbis'],
      container: 'ogg',
      confidence: 'high'
    },
    // HLS
    'm3u8': {
      mimeType: 'application/vnd.apple.mpegurl',
      container: 'hls',
      confidence: 'high'
    },
    // DASH
    'mpd': {
      mimeType: 'application/dash+xml',
      container: 'dash',
      confidence: 'high'
    },
    // AVI
    'avi': {
      mimeType: 'video/x-msvideo',
      container: 'avi',
      confidence: 'medium'
    },
    // MOV
    'mov': {
      mimeType: 'video/quicktime',
      container: 'mov',
      confidence: 'medium'
    },
    // WMV
    'wmv': {
      mimeType: 'video/x-ms-wmv',
      container: 'wmv',
      confidence: 'low'
    },
    // FLV
    'flv': {
      mimeType: 'video/x-flv',
      container: 'flv',
      confidence: 'low'
    }
  };

  /**
   * 从URL或文件名检测MIME类型
   * @param src 视频源URL或文件名
   * @returns MIME类型信息
   */
  static detectFromUrl(src: string): MimeTypeInfo | null {
    try {
      // 移除查询参数和片段
      const cleanUrl = src.split('?')[0].split('#')[0];
      const extension = cleanUrl.split('.').pop()?.toLowerCase();
      
      if (extension && this.MIME_TYPE_MAP[extension]) {
        return this.MIME_TYPE_MAP[extension];
      }
      
      // 特殊URL模式检测
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        return {
          mimeType: 'video/youtube',
          container: 'youtube',
          confidence: 'high'
        };
      }
      
      if (src.includes('vimeo.com')) {
        return {
          mimeType: 'video/vimeo',
          container: 'vimeo',
          confidence: 'high'
        };
      }
      
      if (src.startsWith('webrtc:') || src.includes('protocol=webrtc')) {
        return {
          mimeType: 'application/webrtc',
          container: 'webrtc',
          confidence: 'high'
        };
      }
      
      return null;
    } catch {
      console.warn('MIME type detection failed');
      return null;
    }
  }

  /**
   * 通过HTTP HEAD请求检测MIME类型
   * @param src 视频源URL
   * @returns Promise<MimeTypeInfo | null>
   */
  static async detectFromHeaders(src: string): Promise<MimeTypeInfo | null> {
    try {
      // 只对HTTP/HTTPS URL进行HEAD请求
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        return null;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const response = await fetch(src, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return null;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType) {
        return null;
      }
      
      // 解析Content-Type头
      const [mimeType, ...params] = contentType.split(';');
      const cleanMimeType = mimeType.trim().toLowerCase();
      
      // 提取编解码器信息
      const codecsParam = params.find(p => p.trim().startsWith('codecs='));
      let codecs: string[] | undefined;
      
      if (codecsParam) {
        const codecsValue = codecsParam.split('=')[1]?.replace(/"/g, '');
        codecs = codecsValue ? codecsValue.split(',').map(c => c.trim()) : undefined;
      }
      
      return {
        mimeType: cleanMimeType,
        codecs,
        container: this.getContainerFromMimeType(cleanMimeType),
        confidence: 'high'
      };
    } catch {
      // 网络错误或CORS问题，静默失败
      return null;
    }
  }

  /**
   * 从MIME类型推断容器格式
   * @param mimeType MIME类型
   * @returns 容器格式
   */
  private static getContainerFromMimeType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogg',
      'application/vnd.apple.mpegurl': 'hls',
      'application/dash+xml': 'dash',
      'video/x-msvideo': 'avi',
      'video/quicktime': 'mov',
      'video/x-ms-wmv': 'wmv',
      'video/x-flv': 'flv'
    };
    
    return typeMap[mimeType] || 'unknown';
  }

  /**
   * 检测浏览器对特定MIME类型和编解码器的支持
   * @param mimeTypeInfo MIME类型信息
   * @returns 支持级别
   */
  static checkBrowserSupport(mimeTypeInfo: MimeTypeInfo): 'probably' | 'maybe' | '' {
    if (typeof document === 'undefined') {
      return '';
    }
    
    const video = document.createElement('video');
    
    // 构建完整的MIME类型字符串
    let fullMimeType = mimeTypeInfo.mimeType;
    if (mimeTypeInfo.codecs && mimeTypeInfo.codecs.length > 0) {
      fullMimeType += `; codecs="${mimeTypeInfo.codecs.join(', ')}"`;
    }
    
    return video.canPlayType(fullMimeType) as 'probably' | 'maybe' | '';
  }

  /**
   * 综合检测MIME类型信息
   * @param src 视频源URL
   * @returns Promise<MimeTypeInfo | null>
   */
  static async detect(src: string): Promise<MimeTypeInfo | null> {
    // 首先尝试从URL检测
    const urlResult = this.detectFromUrl(src);
    
    // 如果URL检测成功且置信度高，直接返回
    if (urlResult && urlResult.confidence === 'high') {
      return urlResult;
    }
    
    // 尝试从HTTP头检测
    const headerResult = await this.detectFromHeaders(src);
    
    // 优先返回HTTP头检测结果
    return headerResult || urlResult;
  }
}