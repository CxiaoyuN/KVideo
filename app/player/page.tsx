'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Icons } from '@/components/ui/Icon';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { VideoMetadata } from '@/components/player/VideoMetadata';
import { EpisodeList } from '@/components/player/EpisodeList';
import { PlayerError } from '@/components/player/PlayerError';
import { useVideoPlayer } from '@/lib/hooks/useVideoPlayer';
import Image from 'next/image';

function PlayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const videoId = searchParams.get('id');
  const source = searchParams.get('source');
  const title = searchParams.get('title');
  const episodeParam = searchParams.get('episode');

  // Redirect if no video ID or source
  if (!videoId || !source) {
    router.push('/');
    return null;
  }

  const {
    videoData,
    loading,
    videoError,
    currentEpisode,
    playUrl,
    setCurrentEpisode,
    setPlayUrl,
    setVideoError,
    fetchVideoDetails,
  } = useVideoPlayer(videoId, source, episodeParam);

  const handleEpisodeClick = (episode: any, index: number) => {
    setCurrentEpisode(index);
    setPlayUrl(episode.url);
    setVideoError('');
    
    // Update URL to reflect current episode
    const params = new URLSearchParams(searchParams.toString());
    params.set('episode', index.toString());
    router.replace(`/player?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      {/* Glass Navbar */}
      <nav className="sticky top-4 z-50 mx-4 mt-4 mb-8">
        <div className="max-w-7xl mx-auto bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] shadow-[0_4px_12px_color-mix(in_srgb,var(--shadow-color)_40%,transparent)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/')}
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                title="返回首页"
              >
                <Image 
                  src="/icon.png" 
                  alt="KVideo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
              </button>
              <Button 
                variant="secondary" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <Icons.ChevronLeft size={20} />
                <span>返回</span>
              </Button>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent mb-4"></div>
            <p className="text-[var(--text-color-secondary)]">正在加载视频详情...</p>
          </div>
        ) : videoError && !videoData ? (
          <PlayerError 
            error={videoError} 
            onBack={() => router.back()} 
            onRetry={fetchVideoDetails} 
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player Section */}
            <div className="lg:col-span-2 space-y-6">
              <VideoPlayer
                playUrl={playUrl}
                videoId={videoId || undefined}
                currentEpisode={currentEpisode}
                onBack={() => router.back()}
              />
              <VideoMetadata 
                videoData={videoData} 
                source={source} 
                title={title} 
              />
            </div>

            {/* Episodes Sidebar */}
            <div className="lg:col-span-1">
              <EpisodeList
                episodes={videoData?.episodes || null}
                currentEpisode={currentEpisode}
                onEpisodeClick={handleEpisodeClick}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent"></div>
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
}
