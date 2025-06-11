import Hls from 'hls.js';
import { BaseEngine } from '../base/BaseEngine';

export class HlsEngine extends BaseEngine {
  private hls: Hls | null = null;

  canPlayType(type: string): boolean {
    return type.includes('m3u8') || type.includes('application/vnd.apple.mpegurl');
  }

  async load(src: string): Promise<void> {
    try {
      // 检查浏览器是否原生支持HLS
      if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        this.videoElement.src = src;
        return;
      }

      // 使用hls.js
      if (Hls.isSupported()) {
        this.hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        this.hls.loadSource(src);
        this.hls.attachMedia(this.videoElement);

        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            this.emit('error', new Error(`HLS Error: ${data.type} - ${data.details}`));
          }
        });
      } else {
        throw new Error('HLS is not supported in this browser');
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }
}