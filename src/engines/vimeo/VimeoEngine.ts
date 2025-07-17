import { BaseEngine } from '../base/BaseEngine';

/**
 * Vimeo视频引擎 - 支持Vimeo视频播放
 * 使用Vimeo Player API加载和控制Vimeo视频
 */
export class VimeoEngine extends BaseEngine {
  private player: any = null;
  private apiLoaded: boolean = false;
  private videoId: string = '';
  private playerReady: boolean = false;
  private pendingActions: {type: string, value?: any}[] = [];
  
  getEngineType(): string {
    return 'vimeo';
  }
  
  /**
   * 检查是否可以播放Vimeo视频
   * @param type 视频类型或URL
   * @returns 是否支持播放
   */
  canPlayType(type: string): boolean {
    // 检查是否是Vimeo URL
    return (
      type.includes('vimeo.com/') ||
      type.includes('player.vimeo.com/video/') ||
      type.includes('vimeo:')
    );
  }

  /**
   * 从Vimeo URL中提取视频ID
   * @param url Vimeo视频URL
   * @returns 视频ID
   */
  private extractVideoId(url: string): string {
    let videoId = '';
    
    // 处理标准Vimeo URL: https://vimeo.com/VIDEO_ID
    if (url.includes('vimeo.com/')) {
      const parts = url.split('vimeo.com/');
      if (parts.length > 1) {
        videoId = parts[1].split(/[?&]/)[0];
      }
    }
    // 处理嵌入URL: https://player.vimeo.com/video/VIDEO_ID
    else if (url.includes('player.vimeo.com/video/')) {
      const parts = url.split('player.vimeo.com/video/');
      if (parts.length > 1) {
        videoId = parts[1].split(/[?&]/)[0];
      }
    }
    // 处理自定义格式: vimeo:VIDEO_ID
    else if (url.includes('vimeo:')) {
      videoId = url.split('vimeo:')[1];
    }
    
    return videoId;
  }

  /**
   * 加载Vimeo Player API
   * @returns Promise
   */
  private loadVimeoAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Vimeo && window.Vimeo.Player) {
        this.apiLoaded = true;
        resolve();
        return;
      }

      // 加载Vimeo Player API
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = () => {
        this.apiLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Vimeo API'));
      document.head.appendChild(script);
    });
  }

  /**
   * 创建Vimeo播放器
   * @param videoId Vimeo视频ID
   * @returns Promise
   */
  private createPlayer(videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 创建一个容器元素来替代video元素
      const container = document.createElement('div');
      container.id = 'vimeo-player-' + Date.now();
      container.style.width = '100%';
      container.style.height = '100%';
      
      // 将容器插入到video元素的父元素中
      const parent = this.videoElement.parentElement;
      if (parent) {
        // 保存video元素的样式属性
        const width = this.videoElement.style.width || '100%';
        const height = this.videoElement.style.height || '100%';
        
        // 隐藏原始video元素
        this.videoElement.style.display = 'none';
        
        // 设置容器样式
        container.style.width = width;
        container.style.height = height;
        
        // 插入容器
        parent.insertBefore(container, this.videoElement);
        
        try {
          // 创建Vimeo播放器
          this.player = new (window as any).Vimeo.Player(container, {
            id: videoId,
            controls: false, // 隐藏Vimeo控件，使用自定义控件
            autoplay: false,
            loop: false,
            muted: false,
            responsive: true,
            dnt: true // 不跟踪用户数据
          });

          // 设置事件监听器
          this.player.on('loaded', () => {
            this.playerReady = true;
            this.emit('loadedmetadata');
            this.emit('canplay');
            this.processPendingActions();
            resolve();
          });

          this.player.on('play', () => this.emit('play'));
          this.player.on('pause', () => this.emit('pause'));
          this.player.on('ended', () => this.emit('ended'));
          this.player.on('bufferstart', () => this.emit('loadstart'));
          this.player.on('timeupdate', (data: any) => this.emit('timeupdate', data.seconds));
          this.player.on('progress', (data: any) => {
            // 创建一个类似TimeRanges的对象
            const timeRanges = {
              length: 1,
              start: (index: number) => index === 0 ? 0 : 0,
              end: (index: number) => index === 0 ? data.seconds : 0
            } as TimeRanges;
            
            this.emit('progress', timeRanges);
          });
          this.player.on('error', (error: any) => {
            this.emit('error', new Error(`Vimeo Error: ${error}`));
            reject(error);
          });
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Video element has no parent'));
      }
    });
  }

  /**
   * 处理待处理的操作
   */
  private processPendingActions(): void {
    if (!this.playerReady || !this.player) return;
    
    for (const action of this.pendingActions) {
      switch (action.type) {
        case 'play':
          this.player.play();
          break;
        case 'pause':
          this.player.pause();
          break;
        case 'seek':
          this.player.setCurrentTime(action.value);
          break;
        case 'volume':
          this.player.setVolume(action.value);
          break;
      }
    }
    
    this.pendingActions = [];
  }

  /**
   * 加载Vimeo视频
   * @param src 视频URL或ID
   */
  async load(src: string): Promise<void> {
    try {
      this.videoId = this.extractVideoId(src);
      
      if (!this.videoId) {
        throw new Error('Invalid Vimeo URL or video ID');
      }
      
      // 加载Vimeo API
      if (!this.apiLoaded) {
        await this.loadVimeoAPI();
      }
      
      // 创建播放器
      await this.createPlayer(this.videoId);
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * 播放视频
   */
  play(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.player && this.playerReady) {
        this.player.play().then(resolve).catch(reject);
      } else {
        this.pendingActions.push({ type: 'play' });
        resolve(); // 仍然解析Promise，因为操作将在播放器准备好时执行
      }
    });
  }

  /**
   * 暂停视频
   */
  pause(): void {
    if (this.player && this.playerReady) {
      this.player.pause();
    } else {
      this.pendingActions.push({ type: 'pause' });
    }
  }

  /**
   * 跳转到指定时间
   * @param time 时间（秒）
   */
  seek(time: number): void {
    if (this.player && this.playerReady) {
      this.player.setCurrentTime(time);
    } else {
      this.pendingActions.push({ type: 'seek', value: time });
    }
  }

  /**
   * 设置音量
   * @param volume 音量（0-1）
   */
  setVolume(volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    
    if (this.player && this.playerReady) {
      this.player.setVolume(normalizedVolume);
    } else {
      this.pendingActions.push({ type: 'volume', value: normalizedVolume });
    }
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    if (this.player) {
      try {
        this.player.destroy();
      } catch {
        // 忽略可能的错误
      }
      this.player = null;
    }
    
    // 恢复video元素
    if (this.videoElement) {
      this.videoElement.style.display = '';
    }
    
    this.playerReady = false;
    this.pendingActions = [];
  }
}

// 为TypeScript声明全局Vimeo对象
declare global {
  interface Window {
    Vimeo?: any;
  }
}