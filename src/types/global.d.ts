/**
 * 全局类型声明文件
 * 为第三方API和全局对象提供类型定义
 */

// YouTube IFrame API 类型定义
interface YT {
  Player: {
    new (elementId: string, options: {
      videoId: string;
      playerVars?: {
        autoplay?: number;
        controls?: number;
        rel?: number;
        showinfo?: number;
        modestbranding?: number;
        [key: string]: any;
      };
      events?: {
        onReady?: () => void;
        onStateChange?: (event: any) => void;
        onError?: (event: any) => void;
        [key: string]: any;
      };
    }): any;
  };
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

// Vimeo Player API 类型定义
interface Vimeo {
  Player: {
    new (element: string | HTMLElement, options: {
      id?: string | number;
      url?: string;
      autopause?: boolean;
      autoplay?: boolean;
      background?: boolean;
      byline?: boolean;
      color?: string;
      controls?: boolean;
      dnt?: boolean;
      height?: number | string;
      loop?: boolean;
      maxheight?: number | string;
      maxwidth?: number | string;
      muted?: boolean;
      playsinline?: boolean;
      portrait?: boolean;
      responsive?: boolean;
      speed?: boolean;
      title?: boolean;
      transparent?: boolean;
      width?: number | string;
      [key: string]: any;
    }): any;
  };
}

// 扩展全局Window接口
declare global {
  interface Window {
    YT?: YT;
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: Vimeo;
  }
}

// 防止TypeScript将此文件视为模块
export {};