'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icon';

interface VideoPlayerProps {
  playUrl: string;
  videoId?: string;
  currentEpisode: number;
  onBack: () => void;
}

export function VideoPlayer({ playUrl, videoId, currentEpisode, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState<string>('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    let errorMessage = 'Video playback failed';
    
    if (video.error) {
      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video format is not supported or corrupted';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video source not supported or unavailable';
          break;
        default:
          errorMessage = `Video error: ${video.error.message || 'Unknown error'}`;
      }
    }
    
    console.error('Video playback error:', errorMessage, video.error);
    setVideoError(errorMessage);
    setIsVideoLoading(false);
  };

  const handleVideoLoadStart = () => {
    setIsVideoLoading(true);
    setVideoError('');
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
  };

  const handleRetry = () => {
    setVideoError('');
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  if (!playUrl) {
    return (
      <Card hover={false} className="p-0 overflow-hidden">
        <div className="aspect-video bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] rounded-[var(--radius-2xl)] flex items-center justify-center border border-[var(--glass-border)]">
          <div className="text-center text-[var(--text-secondary)]">
            <Icons.TV size={64} className="text-[var(--text-color-secondary)] mx-auto mb-4" />
            <p>暂无播放源</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover={false} className="p-0 overflow-hidden">
      <div className="relative aspect-video bg-black rounded-[var(--radius-2xl)] overflow-hidden">
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 p-4">
            <div className="text-center text-white max-w-md">
              <Icons.AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
              <p className="text-lg font-semibold mb-2">播放失败</p>
              <p className="text-sm text-gray-300 mb-4">{videoError}</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button 
                  variant="primary"
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                >
                  <Icons.RefreshCw size={16} />
                  <span>重试</span>
                </Button>
                <Button 
                  variant="secondary"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <Icons.ChevronLeft size={16} />
                  <span>返回</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {isVideoLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm">加载中...</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay
          src={playUrl}
          onError={handleVideoError}
          onLoadStart={handleVideoLoadStart}
          onCanPlay={handleVideoCanPlay}
          onLoadedMetadata={() => {
            if (videoRef.current && videoId) {
              const savedTime = localStorage.getItem(`video_progress_${videoId}_${currentEpisode}`);
              if (savedTime) {
                videoRef.current.currentTime = parseFloat(savedTime);
              }
            }
          }}
        />
      </div>
    </Card>
  );
}
