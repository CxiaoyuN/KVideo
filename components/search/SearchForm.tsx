'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icon';
import { SearchLoadingAnimation } from '@/components/SearchLoadingAnimation';

interface SearchFormProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading: boolean;
  initialQuery?: string;
  currentSource?: string;
  checkedSources?: number;
  totalSources?: number;
  checkedVideos?: number;
  totalVideos?: number;
  searchStage?: 'searching' | 'checking';
}

export function SearchForm({
  onSearch,
  onClear,
  isLoading,
  initialQuery = '',
  currentSource = '',
  checkedSources = 0,
  totalSources = 16,
  checkedVideos = 0,
  totalVideos = 0,
  searchStage = 'searching',
}: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="relative group">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索电影、电视剧、综艺..."
          className="text-lg pr-32"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-32 top-1/2 -translate-y-1/2 p-2 text-[var(--text-color-secondary)] hover:text-[var(--text-color)] transition-colors"
          >
            <Icons.X size={20} />
          </button>
        )}
        <Button
          type="submit"
          disabled={!query.trim()}
          variant="primary"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-8"
        >
          <span className="flex items-center gap-2">
            <Icons.Search size={20} />
            搜索
          </span>
        </Button>
      </div>
      
      {/* Loading Animation */}
      {isLoading && (
        <div className="mt-4">
          <SearchLoadingAnimation 
            currentSource={currentSource}
            checkedSources={checkedSources}
            totalSources={totalSources}
            checkedVideos={checkedVideos}
            totalVideos={totalVideos}
            stage={searchStage}
          />
        </div>
      )}
    </form>
  );
}
