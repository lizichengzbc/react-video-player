import { BaseEngine } from '../base/BaseEngine';

export class NativeEngine extends BaseEngine {
  canPlayType(type: string): boolean {
    return this.videoElement.canPlayType(type) !== '';
  }

  async load(src: string): Promise<void> {
    try {
      this.videoElement.src = src;
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  destroy(): void {
    this.videoElement.src = '';
  }
}