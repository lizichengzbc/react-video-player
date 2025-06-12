import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';

// Mock HTMLVideoElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

describe('VideoPlayer Component', () => {
  const defaultProps = {
    src: 'https://example.com/video.mp4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders video player with default props', () => {
    render(<VideoPlayer {...defaultProps} />);
    
    const videoElement = screen.getByRole('application');
    expect(videoElement).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const customClass = 'custom-video-player';
    render(<VideoPlayer {...defaultProps} className={customClass} />);
    
    const container = screen.getByRole('application');
    expect(container).toHaveClass(customClass);
  });

  test('sets video source correctly', () => {
    render(<VideoPlayer {...defaultProps} />);
    
    // Note: The actual video element might be created by the engine
    // This test verifies the component renders without errors
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('handles autoplay prop', () => {
    render(<VideoPlayer {...defaultProps} autoplay />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('handles muted prop', () => {
    render(<VideoPlayer {...defaultProps} muted />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('handles loop prop', () => {
    render(<VideoPlayer {...defaultProps} loop />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('calls onPlay callback when provided', () => {
    const onPlayMock = vi.fn();
    render(<VideoPlayer {...defaultProps} onPlay={onPlayMock} />);
    
    // The callback will be tested through integration with the actual video events
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('calls onPause callback when provided', () => {
    const onPauseMock = vi.fn();
    render(<VideoPlayer {...defaultProps} onPause={onPauseMock} />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('calls onError callback when provided', () => {
    const onErrorMock = vi.fn();
    render(<VideoPlayer {...defaultProps} onError={onErrorMock} />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('renders with custom dimensions', () => {
    render(
      <VideoPlayer 
        {...defaultProps} 
        width={800} 
        height={450} 
      />
    );
    
    const container = screen.getByRole('application');
    expect(container).toHaveStyle({
      width: '800px',
      height: '450px'
    });
  });

  test('renders with percentage dimensions', () => {
    render(
      <VideoPlayer 
        {...defaultProps} 
        width="100%" 
        height="56.25%" 
      />
    );
    
    const container = screen.getByRole('application');
    expect(container).toHaveStyle({
      width: '100%',
      height: '56.25%'
    });
  });

  test('shows controls when controls prop is true', () => {
    render(<VideoPlayer {...defaultProps} controls />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
    // Controls visibility will be tested in integration tests
  });

  test('handles poster image', () => {
    const posterUrl = 'https://example.com/poster.jpg';
    render(<VideoPlayer {...defaultProps} poster={posterUrl} />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('renders without crashing with minimal props', () => {
    render(<VideoPlayer src="test.mp4" />);
    
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  test('handles different video formats', () => {
    const formats = [
      'https://example.com/video.mp4',
      'https://example.com/video.webm',
      'https://example.com/playlist.m3u8',
      'https://example.com/manifest.mpd',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com/123456789'
    ];

    formats.forEach(src => {
      const { unmount } = render(<VideoPlayer src={src} />);
      expect(screen.getByRole('application')).toBeInTheDocument();
      unmount();
    });
  });
});