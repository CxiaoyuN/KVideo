/**
 * Search History Store
 * 搜索历史记录存储
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_SEARCH_HISTORY = 20;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface SearchHistoryStore {
  searchHistory: SearchHistoryItem[];
  
  addSearchHistory: (query: string) => void;
  removeSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  getSearchHistory: () => SearchHistoryItem[];
}

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set, get) => ({
      searchHistory: [],

      addSearchHistory: (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        set((state) => {
          // 移除已存在的相同搜索
          const filtered = state.searchHistory.filter(
            (item) => item.query !== trimmedQuery
          );

          // 添加新搜索到顶部
          const newHistory = [
            { query: trimmedQuery, timestamp: Date.now() },
            ...filtered,
          ].slice(0, MAX_SEARCH_HISTORY);

          return { searchHistory: newHistory };
        });
      },

      removeSearchHistory: (query: string) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter(
            (item) => item.query !== query
          ),
        }));
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      getSearchHistory: () => {
        return get().searchHistory;
      },
    }),
    {
      name: 'kvideo-search-history',
    }
  )
);
