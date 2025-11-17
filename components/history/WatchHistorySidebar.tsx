/**
 * Watch History Sidebar Component
 * 观看历史侧边栏组件
 */

'use client';

import { useState } from 'react';
import { useHistoryStore } from '@/lib/store/history-store';
import { Icons } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export function WatchHistorySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { viewingHistory, removeFromHistory, clearHistory } = useHistoryStore();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getVideoUrl = (item: any): string => {
    const params = new URLSearchParams({
      id: item.videoId.toString(),
      source: item.source,
      title: item.title,
      episode: item.episodeIndex.toString(),
    });
    return `/player?${params.toString()}`;
  };

  const handleItemClick = (item: any, event: React.MouseEvent) => {
    // Middle mouse or Ctrl/Cmd+click opens in new tab
    if (event.button === 1 || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      window.open(getVideoUrl(item), '_blank');
      return;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-md)] p-3 hover:scale-105 transition-all"
        aria-label="打开观看历史"
      >
        <Icons.History size={24} className="text-[var(--text-color)]" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1999] bg-black/30 backdrop-blur-[5px] opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[90%] max-w-[420px] z-[2000] bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] border-l border-[var(--glass-border)] rounded-tl-[var(--radius-2xl)] rounded-bl-[var(--radius-2xl)] p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-transform duration-[400ms] cubic-bezier(0.2,0.8,0.2,1) ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <Icons.History size={24} className="text-[var(--accent-color)]" />
            <h2 className="text-xl font-semibold text-[var(--text-color)]">
              观看历史
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-colors"
            aria-label="关闭"
          >
            <Icons.X size={24} className="text-[var(--text-color-secondary)]" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {viewingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Icons.Inbox size={64} className="text-[var(--text-color-secondary)] opacity-50 mb-4" />
              <p className="text-[var(--text-color-secondary)] text-lg">
                暂无观看历史
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewingHistory.map((item) => {
                const progress = (item.playbackPosition / item.duration) * 100;
                const episodeText = item.episodes && item.episodes.length > 0 
                  ? item.episodes[item.episodeIndex]?.name || `第${item.episodeIndex + 1}集`
                  : '';

                return (
                  <div
                    key={`${item.videoId}-${item.source}-${item.timestamp}`}
                    className="group bg-[color-mix(in_srgb,var(--glass-bg)_50%,transparent)] rounded-[var(--radius-2xl)] p-3 hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)] transition-all border border-transparent hover:border-[var(--glass-border)]"
                  >
                    <a
                      href={getVideoUrl(item)}
                      onClick={(e) => {
                        e.preventDefault();
                        handleItemClick(item, e as any);
                        if (!e.ctrlKey && !e.metaKey) {
                          window.location.href = getVideoUrl(item);
                        }
                      }}
                      onAuxClick={(e) => handleItemClick(item, e as any)}
                      className="block"
                    >
                      <div className="flex gap-3">
                        {/* Poster */}
                        <div className="relative w-28 h-16 flex-shrink-0 bg-[var(--glass-bg)] rounded-[var(--radius-2xl)] overflow-hidden">
                          {item.poster ? (
                            <Image
                              src={item.poster}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icons.Film size={32} className="text-[var(--text-color-secondary)] opacity-30" />
                            </div>
                          )}
                          {/* Progress overlay */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div
                              className="h-full bg-[var(--accent-color)]"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-[var(--text-color)] truncate group-hover:text-[var(--accent-color)] transition-colors mb-1">
                            {item.title}
                          </h3>
                          {episodeText && (
                            <p className="text-xs text-[var(--text-color-secondary)] mb-1">
                              {episodeText}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-[var(--text-color-secondary)]">
                            <span>{formatTime(item.playbackPosition)} / {formatTime(item.duration)}</span>
                            <span>{formatDate(item.timestamp)}</span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromHistory(item.videoId, item.source);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-[var(--glass-bg)] rounded-full self-start"
                          aria-label="删除"
                        >
                          <Icons.Trash size={16} className="text-[var(--text-color-secondary)]" />
                        </button>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {viewingHistory.length > 0 && (
          <footer className="mt-4 pt-4 border-t border-[var(--glass-border)]">
            <Button
              variant="secondary"
              onClick={clearHistory}
              className="w-full flex items-center justify-center gap-2"
            >
              <Icons.Trash size={18} />
              清空历史
            </Button>
          </footer>
        )}
      </aside>
    </>
  );
}
