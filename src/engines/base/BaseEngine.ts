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