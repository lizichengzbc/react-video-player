import { BaseEngine } from '../base/BaseEngine';

/**
 * YouTube视频引擎 - 支持YouTube视频播放
 * 使用YouTube IFrame API加载和控制YouTube视频
 */
export class YouTubeEngine extends BaseEngine {
  private player: any = null;
  private apiLoaded: boolean = false;
  private videoId: string = '';
  private playerReady: boolean = false;
  private pendingActions: {type: string, value?: any}[] = [];
  
  getEngineType(): string {
    return 'youtube';
  }
  
  /**
   * 检查是否可以播放YouTube视频
   * @param type 视频类型或URL
   * @returns 是否支持播放
   */
  canPlayType(type: string): boolean {
    // 检查是否是YouTube URL
    return (
      type.includes('youtube.com/watch') ||
      type.includes('youtu.be/') ||
      type.includes('youtube:')
    );
  }

  /**
   * 从YouTube URL中提取视频ID
   * @param url YouTube视频URL
   * @returns 视频ID
   */
  private extractVideoId(url: string): string {
    let videoId = '';
    
    // 处理标准YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    }
    // 处理短链接: https://youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    // 处理自定义格式: youtube:VIDEO_ID
    else if (url.includes('youtube:')) {
      videoId = url.split('youtube:')[1];
    }
    
    return videoId;
  }

  /**
   * 加载YouTube API
   * @returns Promise
   */
  private loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        this.apiLoaded = true;
        resolve();
        return;
      }

      // 创建全局回调函数
      const callbackName = 'onYouTubeIframeAPIReady';
      (window as any)[callbackName] = () => {
        this.apiLoaded = true;
        resolve();
      };

      // 加载YouTube IFrame API
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = (e) => reject(new Error('Failed to load YouTube API'));
      document.head.appendChild(script);
    });
  }

  /**
   * 创建YouTube播放器
   * @param videoId YouTube视频ID
   * @returns Promise
   */
  private createPlayer(videoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 创建一个容器元素来替代video元素
      const container = document.createElement('div');
      container.id = 'youtube-player-' + Date.now();
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
          // 创建YouTube播放器
          this.player = new (window as any).YT.Player(container.id, {
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: 0, // 隐藏YouTube控件，使用自定义控件
              rel: 0,      // 不显示相关视频
              showinfo: 0, // 不显示视频信息
              modestbranding: 1 // 最小化YouTube品牌标识
            },
            events: {
              'onReady': () => {
                this.playerReady = true;
                this.emit('loadedmetadata');
                this.emit('canplay');
                this.processPendingActions();
                resolve();
              },
              'onStateChange': (event: any) => this.handleStateChange(event),
              'onError': (event: any) => {
                this.emit('error', new Error(`YouTube Error: ${event.data}`));
                reject(new Error(`YouTube Error: ${event.data}`));
              }
            }
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
   * 处理YouTube播放器状态变化
   * @param event 状态变化事件
   */
  private handleStateChange(event: any): void {
    const YT = (window as any).YT;
    if (!YT) return;
    
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.emit('play');
        // 模拟timeupdate事件
        this.startTimeUpdateEmulation();
        break;
      case YT.PlayerState.PAUSED:
        this.emit('pause');
        this.stopTimeUpdateEmulation();
        break;
      case YT.PlayerState.ENDED:
        this.emit('ended');
        this.stopTimeUpdateEmulation();
        break;
      case YT.PlayerState.BUFFERING:
        this.emit('loadstart');
        break;
    }
  }

  private timeUpdateInterval: number | null = null;

  /**
   * 开始模拟timeupdate事件
   */
  private startTimeUpdateEmulation(): void {
    this.stopTimeUpdateEmulation();
    
    // 使用requestAnimationFrame代替setInterval以获得更好的性能
    const emitTimeUpdate = () => {
      if (this.player && this.playerReady) {
        try {
          const currentTime = this.player.getCurrentTime();
          this.emit('timeupdate', currentTime);
          
          // 模拟progress事件
          const duration = this.player.getDuration();
          const buffered = this.player.getVideoLoadedFraction() * duration;
          // 创建一个类似TimeRanges的对象
          const timeRanges = {
            length: 1,
            start: (index: number) => index === 0 ? 0 : 0,
            end: (index: number) => index === 0 ? buffered : 0
          } as TimeRanges;
          
          this.emit('progress', timeRanges);
          
          // 如果仍在播放，继续更新
          if (this.player.getPlayerState() === (window as any).YT.PlayerState.PLAYING) {
            requestAnimationFrame(emitTimeUpdate);
          }
        } catch (e) {
          // 忽略可能的错误
        }
      }
    };
    
    requestAnimationFrame(emitTimeUpdate);
  }

  /**
   * 停止模拟timeupdate事件
   */
  private stopTimeUpdateEmulation(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  /**
   * 处理待处理的操作
   */
  private processPendingActions(): void {
    if (!this.playerReady || !this.player) return;
    
    for (const action of this.pendingActions) {
      switch (action.type) {
        case 'play':
          this.player.playVideo();
          break;
        case 'pause':
          this.player.pauseVideo();
          break;
        case 'seek':
          this.player.seekTo(action.value);
          break;
        case 'volume':
          this.player.setVolume(action.value * 100);
          break;
      }
    }
    
    this.pendingActions = [];
  }

  /**
   * 加载YouTube视频
   * @param src 视频URL或ID
   */
  async load(src: string): Promise<void> {
    try {
      this.videoId = this.extractVideoId(src);
      
      if (!this.videoId) {
        throw new Error('Invalid YouTube URL or video ID');
      }
      
      // 加载YouTube API
      if (!this.apiLoaded) {
        await this.loadYouTubeAPI();
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
        this.player.playVideo();
        resolve();
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
      this.player.pauseVideo();
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
      this.player.seekTo(time);
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
      // YouTube音量范围是0-100
      this.player.setVolume(normalizedVolume * 100);
    } else {
      this.pendingActions.push({ type: 'volume', value: normalizedVolume });
    }
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    this.stopTimeUpdateEmulation();
    
    if (this.player) {
      try {
        this.player.destroy();
      } catch (e) {
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