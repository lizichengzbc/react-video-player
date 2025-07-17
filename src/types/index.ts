export interface VideoSource {
  src: string;
  type?: string;
  quality?: string;
}

export interface VideoPlayerState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered?: TimeRanges | null;
}

export interface VideoPlayerConfig {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface VideoPlayerControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  reload: () => void;
  retry: () => void;
}