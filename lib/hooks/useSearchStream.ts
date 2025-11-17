'use client';

import { useState, useRef, useCallback } from 'react';
import { getSourceName, SOURCE_IDS } from '@/lib/utils/source-names';

export interface SearchStreamResult {
  loading: boolean;
  results: any[];
  availableSources: any[];
  checkedSources: number;
  searchStage: 'searching' | 'checking';
  checkedVideos: number;
  totalVideos: number;
  currentSource: string;
  performSearch: (query: string, shouldClearCache?: boolean) => Promise<void>;
  resetSearch: () => void;
}

export function useSearchStream(
  onCacheUpdate: (query: string, results: any[], sources: any[]) => void,
  onUrlUpdate: (query: string) => void
): SearchStreamResult {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [checkedSources, setCheckedSources] = useState(0);
  const [searchStage, setSearchStage] = useState<'searching' | 'checking'>('searching');
  const [checkedVideos, setCheckedVideos] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentSource, setCurrentSource] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchQuery: string, shouldClearCache: boolean = true) => {
    if (!searchQuery.trim() || loading) return;

    // Abort any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Reset state
    setLoading(true);
    setResults([]);
    setAvailableSources([]);
    setCheckedSources(0);
    setSearchStage('searching');
    setCheckedVideos(0);
    setTotalVideos(0);

    // Update URL
    onUrlUpdate(searchQuery);

    try {
      const response = await fetch('/api/search-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, sources: SOURCE_IDS }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Search failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      let buffer = '';
      const allVideos: any[] = [];
      const sourceVideoCounts = new Map<string, number>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              if (data.stage === 'searching') {
                setSearchStage('searching');
                setCheckedSources(data.checkedSources);
              } else if (data.stage === 'checking') {
                setSearchStage('checking');
                setCheckedVideos(data.checkedVideos);
                setTotalVideos(data.totalVideos);
              }
            } else if (data.type === 'videos') {
              const newVideos = data.videos.map((video: any) => ({
                ...video,
                sourceName: getSourceName(video.source),
                isNew: true,
                addedAt: Date.now(),
              }));

              allVideos.push(...newVideos);
              setResults([...allVideos]);
              setCheckedVideos(data.checkedVideos);
              setTotalVideos(data.totalVideos);

              // Update source counts
              newVideos.forEach((video: any) => {
                const count = sourceVideoCounts.get(video.source) || 0;
                sourceVideoCounts.set(video.source, count + 1);
              });

              const sourcesArray = Array.from(sourceVideoCounts.entries()).map(([sourceId, count]) => ({
                id: sourceId,
                name: getSourceName(sourceId),
                count,
              }));
              setAvailableSources(sourcesArray);

              // Remove "new" animation after delay
              setTimeout(() => {
                setResults(prev => prev.map(v => {
                  const wasJustAdded = newVideos.some((nv: any) => 
                    nv.vod_id === v.vod_id && nv.source === v.source && nv.addedAt === v.addedAt
                  );
                  return wasJustAdded ? { ...v, isNew: false } : v;
                }));
              }, 300);
            } else if (data.type === 'complete') {
              setCheckedVideos(data.totalVideos);
              setLoading(false);

              const finalSourcesArray = Array.from(sourceVideoCounts.entries()).map(([sourceId, count]) => ({
                id: sourceId,
                name: getSourceName(sourceId),
                count,
              }));
              
              // Save to cache
              onCacheUpdate(searchQuery, allVideos, finalSourcesArray);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (err) {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
      setLoading(false);
    } finally {
      setCurrentSource('');
    }
  }, [loading, onCacheUpdate, onUrlUpdate]);

  const resetSearch = useCallback(() => {
    setResults([]);
    setAvailableSources([]);
    setCheckedSources(0);
    setSearchStage('searching');
    setCheckedVideos(0);
    setTotalVideos(0);
    setCurrentSource('');
  }, []);

  return {
    loading,
    results,
    availableSources,
    checkedSources,
    searchStage,
    checkedVideos,
    totalVideos,
    currentSource,
    performSearch,
    resetSearch,
  };
}
