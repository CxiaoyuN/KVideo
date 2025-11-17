'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';

interface Video {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  vod_year?: string;
  type_name?: string;
  source: string;
  sourceName?: string;
  isNew?: boolean;
  isVerifying?: boolean;
}

interface VideoGridProps {
  videos: Video[];
  className?: string;
}

export function VideoGrid({ videos, className = '' }: VideoGridProps) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 ${className}`}>
      {videos.map((video, index) => {
        const videoUrl = `/player?${new URLSearchParams({
          id: video.vod_id,
          source: video.source,
          title: video.vod_name,
        }).toString()}`;
        
        return (
          <Link 
            key={`${video.vod_id}-${index}`}
            href={videoUrl}
          >
            <Card
              className={`p-0 overflow-hidden group cursor-pointer flex flex-col h-full ${video.isNew ? 'animate-scale-in' : ''}`}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)] overflow-hidden" style={{ borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0' }}>
                {video.vod_pic ? (
                  <img
                    src={video.vod_pic}
                    alt={video.vod_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icons.Film size={64} className="text-[var(--text-color-secondary)]" />
                  </div>
                )}
                
                {/* Source Badge - Top Left */}
                {video.sourceName && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="primary" className="text-xs backdrop-blur-md bg-[var(--accent-color)]/90">
                      {video.sourceName}
                    </Badge>
                  </div>
                )}
                
                {/* Verifying Badge - Top Right */}
                {video.isVerifying && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="secondary" className="text-xs backdrop-blur-md bg-yellow-500/90 text-white animate-pulse">
                      验证中
                    </Badge>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {video.type_name && (
                      <Badge variant="secondary" className="text-xs mb-2">
                        {video.type_name}
                      </Badge>
                    )}
                    {video.vod_year && (
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Icons.Calendar size={12} />
                        <span>{video.vod_year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info - Fixed height section */}
              <div className="p-3 flex-1 flex flex-col">
                <h4 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 min-h-[2.5rem] group-hover:text-[var(--accent-color)] transition-colors">
                  {video.vod_name}
                </h4>
                {video.vod_remarks && (
                  <p className="text-xs text-[var(--text-color-secondary)] mt-1 line-clamp-1">
                    {video.vod_remarks}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
