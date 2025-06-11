// 替换静态导入
// import dashjs from 'dashjs';
import { BaseEngine } from '../base/BaseEngine';

export class DashEngine extends BaseEngine {
  private player: any | null = null;
  private dashjs: any = null;

  canPlayType(type: string): boolean {
    return type.includes('mpd') || type.includes('application/dash+xml');
  }

  async load(src: string): Promise<void> {
    try {
      // 动态导入 dashjs
      if (!this.dashjs) {
        const dashModule = await import('dashjs');
        this.dashjs = dashModule.default || dashModule;
      }

      if (!this.dashjs) {
        throw new Error('dashjs library is not available');
      }

      // 修正 MediaPlayer 创建方式
      // 根据 dashjs 文档，正确的创建方式是：
      this.player = this.dashjs.MediaPlayer().create();
      
      this.player.initialize(this.videoElement, src, false);
      
      this.player.on(this.dashjs.MediaPlayer.events.ERROR, (e) => {
        this.emit('error', new Error(`DASH Error: ${e.error}`));
      });

      // 配置自适应比特率
      this.player.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: {
              video: true,
              audio: true
            }
          }
        }
      });
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  destroy(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
}