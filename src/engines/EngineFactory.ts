import { BaseEngine } from './base/BaseEngine';
import { HlsEngine } from './hls/HlsEngine';
import { DashEngine } from './dash/DashEngine';
import { NativeEngine } from './native/NativeEngine';

export class EngineFactory {
  private static engines = [HlsEngine, DashEngine, NativeEngine];

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

  static detectVideoType(src: string): string {
    if (src.includes('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (src.includes('.mpd')) return 'application/dash+xml';
    if (src.includes('.mp4')) return 'video/mp4';
    if (src.includes('.webm')) return 'video/webm';
    return 'video/mp4'; // 默认
  }
}