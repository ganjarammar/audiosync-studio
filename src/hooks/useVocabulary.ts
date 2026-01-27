import { useState, useCallback } from "react";
import { VocabularyWord } from "@/types/caption";
import { getAllVocabulary, clearVocabulary, getVocabularyStats, getVocabularyPage } from "@/lib/db";

export interface VocabularyStats {
  totalUniqueWords: number;
  totalOccurrences: number;
  totalSources: number;
}

export type SortOption = "frequency" | "alphabetical" | "recent";

const PAGE_SIZE = 50;

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [allWordsCache, setAllWordsCache] = useState<VocabularyWord[] | null>(null);
  const [stats, setStats] = useState<VocabularyStats>({
    totalUniqueWords: 0,
    totalOccurrences: 0,
    totalSources: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("frequency");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Load stats separately (lightweight)
  const loadStats = useCallback(async () => {
    const dbStats = await getVocabularyStats();
    setStats({
      totalUniqueWords: dbStats.totalWords,
      totalOccurrences: dbStats.totalOccurrences,
      totalSources: dbStats.totalSources,
    });
  }, []);

  // Load initial page of words
  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadStats();
      const initialWords = await getVocabularyPage(0, PAGE_SIZE);
      setWords(initialWords);
      setHasMore(initialWords.length === PAGE_SIZE);
      setPage(1);
      setAllWordsCache(null);
      setSearchQuery("");
    } finally {
      setIsLoading(false);
    }
  }, [loadStats]);

  // Load more words (pagination)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || searchQuery) return;
    
    setIsLoadingMore(true);
    try {
      const newWords = await getVocabularyPage(page * PAGE_SIZE, PAGE_SIZE);
      setWords(prev => [...prev, ...newWords]);
      setHasMore(newWords.length === PAGE_SIZE);
      setPage(p => p + 1);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, isLoadingMore, hasMore, searchQuery]);

  // Load all words for search/sort (cached)
  const loadAllForSearch = useCallback(async () => {
    if (allWordsCache) return allWordsCache;
    
    setIsLoading(true);
    try {
      const allWords = await getAllVocabulary();
      setAllWordsCache(allWords);
      return allWords;
    } finally {
      setIsLoading(false);
    }
  }, [allWordsCache]);

  // Handle search query change
  const handleSearchChange = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query) {
      // Load all words for search
      const allWords = await loadAllForSearch();
      if (allWords) {
        const filtered = allWords.filter(word =>
          word.word.toLowerCase().includes(query.toLowerCase())
        );
        setWords(filtered);
        setHasMore(false);
      }
    } else {
      // Reset to paginated view
      await loadInitial();
    }
  }, [loadAllForSearch, loadInitial]);

  // Handle sort change
  const handleSortChange = useCallback(async (newSort: SortOption) => {
    setSortBy(newSort);
    
    if (newSort !== "frequency" || searchQuery) {
      // Need all words for custom sorting
      const allWords = await loadAllForSearch();
      if (allWords) {
        const sorted = [...allWords].sort((a, b) => {
          switch (newSort) {
            case "frequency":
              return b.count - a.count;
            case "alphabetical":
              return a.word.localeCompare(b.word);
            case "recent":
              return b.lastSeenAt - a.lastSeenAt;
            default:
              return 0;
          }
        });
        
        const filtered = searchQuery
          ? sorted.filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase()))
          : sorted;
        
        setWords(filtered);
        setHasMore(false);
      }
    } else {
      // Reset to default paginated view
      await loadInitial();
    }
  }, [searchQuery, loadAllForSearch, loadInitial]);

  const clearAllVocabulary = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearVocabulary();
      setWords([]);
      setAllWordsCache(null);
      setStats({
        totalUniqueWords: 0,
        totalOccurrences: 0,
        totalSources: 0,
      });
      setPage(0);
      setHasMore(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get displayed words (already filtered/sorted from state)
  const displayedWords = words;

  return {
    words: displayedWords,
    stats,
    isLoading,
    isLoadingMore,
    hasMore,
    sortBy,
    setSortBy: handleSortChange,
    searchQuery,
    setSearchQuery: handleSearchChange,
    refresh: loadInitial,
    loadMore,
    clearAllVocabulary,
  };
}
