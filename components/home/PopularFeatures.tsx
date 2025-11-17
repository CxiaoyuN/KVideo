'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icon';
import Image from 'next/image';
import Link from 'next/link';

interface DoubanMovie {
  id: string;
  title: string;
  cover: string;
  rate: string;
  url: string;
  cover_x?: number;
  cover_y?: number;
}

interface PopularFeaturesProps {
  onSearch?: (query: string) => void;
}

const DEFAULT_TAGS = [
  { id: 'popular', label: '热门', value: '热门' },
  { id: 'latest', label: '最新', value: '最新' },
  { id: 'classic', label: '经典', value: '经典' },
  { id: 'highscore', label: '豆瓣高分', value: '豆瓣高分' },
  { id: 'underrated', label: '冷门佳片', value: '冷门佳片' },
  { id: 'chinese', label: '华语', value: '华语' },
  { id: 'western', label: '欧美', value: '欧美' },
  { id: 'korean', label: '韩国', value: '韩国' },
  { id: 'japanese', label: '日本', value: '日本' },
  { id: 'action', label: '动作', value: '动作' },
  { id: 'comedy', label: '喜剧', value: '喜剧' },
  { id: 'variety', label: '综艺', value: '综艺' },
  { id: 'romance', label: '爱情', value: '爱情' },
  { id: 'scifi', label: '科幻', value: '科幻' },
  { id: 'thriller', label: '悬疑', value: '悬疑' },
  { id: 'horror', label: '恐怖', value: '恐怖' },
  { id: 'healing', label: '治愈', value: '治愈' },
];

const STORAGE_KEY = 'kvideo_custom_tags';

export function PopularFeatures({ onSearch }: PopularFeaturesProps) {
  const [selectedTag, setSelectedTag] = useState('popular');
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [movies, setMovies] = useState<DoubanMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prefetchRef = useRef<HTMLDivElement>(null);

  const PAGE_LIMIT = 20;

  // Load custom tags from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTags(parsed);
      } catch (e) {
        console.error('Failed to parse saved tags', e);
      }
    }
  }, []);

  // Save tags to localStorage
  const saveTags = (newTags: typeof DEFAULT_TAGS) => {
    setTags(newTags);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
  };

  const loadMovies = useCallback(async (tag: string, pageStart: number, append = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const tagValue = tags.find(t => t.id === tag)?.value || '热门';
      const response = await fetch(
        `/api/douban/recommend?tag=${encodeURIComponent(tagValue)}&page_limit=${PAGE_LIMIT}&page_start=${pageStart}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      const newMovies = data.subjects || [];
      
      setMovies(prev => append ? [...prev, ...newMovies] : newMovies);
      setHasMore(newMovies.length === PAGE_LIMIT);
    } catch (error) {
      console.error('Failed to load movies:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, tags]);

  // Load initial movies when tag changes
  useEffect(() => {
    setPage(0);
    setMovies([]);
    setHasMore(true);
    loadMovies(selectedTag, 0, false);
  }, [selectedTag]);

  // Setup intersection observer for infinite scroll with prefetch
  useEffect(() => {
    if (!prefetchRef.current) return;

    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadMovies(selectedTag, nextPage * PAGE_LIMIT, true);
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    prefetchObserver.observe(prefetchRef.current);

    return () => {
      prefetchObserver.disconnect();
    };
  }, [hasMore, loading, page, selectedTag, loadMovies]);

  const handleMovieClick = (movie: DoubanMovie) => {
    if (onSearch) {
      onSearch(movie.title);
    }
  };

  const addCustomTag = () => {
    if (!newTagInput.trim()) return;
    const newTag = {
      id: `custom_${Date.now()}`,
      label: newTagInput.trim(),
      value: newTagInput.trim(),
    };
    saveTags([...tags, newTag]);
    setNewTagInput('');
  };

  const deleteTag = (tagId: string) => {
    saveTags(tags.filter(t => t.id !== tagId));
    if (selectedTag === tagId) {
      setSelectedTag('popular');
    }
  };

  const restoreDefaults = () => {
    saveTags(DEFAULT_TAGS);
    setSelectedTag('popular');
    setShowTagManager(false);
  };

  const isCustomTag = (tagId: string) => tagId.startsWith('custom_');

  return (
    <div className="animate-fade-in">
      {/* Tag Management UI */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowTagManager(!showTagManager)}
          className="text-sm text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] transition-colors flex items-center gap-2"
        >
          <Icons.Tag size={16} />
          {showTagManager ? '完成' : '管理标签'}
        </button>
        {showTagManager && (
          <button
            onClick={restoreDefaults}
            className="text-sm text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] transition-colors flex items-center gap-2"
          >
            <Icons.RefreshCw size={16} />
            恢复默认
          </button>
        )}
      </div>

      {/* Add Custom Tag */}
      {showTagManager && (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            placeholder="添加自定义标签..."
            className="flex-1 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-color)] px-4 py-2 focus:outline-none focus:border-[var(--accent-color)] transition-colors"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          />
          <button
            onClick={addCustomTag}
            className="px-6 py-2 bg-[var(--accent-color)] text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ borderRadius: 'var(--radius-2xl)' }}
          >
            添加
          </button>
        </div>
      )}

      {/* Tag Filter */}
      <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-3 pt-2 px-1 scrollbar-hide">
        {tags.map((tag) => (
          <div key={tag.id} className="relative flex-shrink-0">
            <button
              onClick={() => setSelectedTag(tag.id)}
              className={`
                px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap
                ${selectedTag === tag.id
                  ? 'bg-[var(--accent-color)] text-white shadow-md scale-105'
                  : 'bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-color)] border border-[var(--glass-border)] hover:border-[var(--accent-color)] hover:scale-105'
                }
              `}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {tag.label}
            </button>
            {showTagManager && isCustomTag(tag.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTag(tag.id);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/?q=${encodeURIComponent(movie.title)}`}
            onClick={(e) => {
              e.preventDefault();
              handleMovieClick(movie);
            }}
            className="group cursor-pointer"
          >
            <Card hover className="overflow-hidden p-0 h-full">
              <div className="relative aspect-[2/3] overflow-hidden bg-[var(--glass-bg)]">
                <Image
                  src={movie.cover}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
                {movie.rate && parseFloat(movie.rate) > 0 && (
                  <div 
                    className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 flex items-center gap-1.5"
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    <Icons.Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">
                      {movie.rate}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-[var(--text-color)] line-clamp-2 group-hover:text-[var(--accent-color)] transition-colors">
                  {movie.title}
                </h3>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Prefetch Trigger - Earlier */}
      {hasMore && !loading && <div ref={prefetchRef} className="h-1" />}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--accent-color)] border-t-transparent"></div>
            <p className="text-sm text-[var(--text-color-secondary)]">加载中...</p>
          </div>
        </div>
      )}

      {/* Intersection Observer Target */}
      {hasMore && !loading && <div ref={loadMoreRef} className="h-20" />}

      {/* No More Content */}
      {!hasMore && movies.length > 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-color-secondary)]">没有更多内容了</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && movies.length === 0 && (
        <div className="text-center py-20">
          <Icons.Film size={64} className="text-[var(--text-color-secondary)] mx-auto mb-4" />
          <p className="text-[var(--text-color-secondary)]">暂无内容</p>
        </div>
      )}
    </div>
  );
}
