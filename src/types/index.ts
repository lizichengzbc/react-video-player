export interface VideoSource {
  src: string;
  type?: string;
  quality?: string;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  buffered: TimeRanges | null;
  error: string | null;
  isLoading: boolean;
}

export interface VideoPlayerConfig {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
}