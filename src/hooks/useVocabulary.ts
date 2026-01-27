import { useState, useCallback, useEffect } from "react";
import { VocabularyWord } from "@/types/caption";
import { getAllVocabulary, clearVocabulary } from "@/lib/db";

export interface VocabularyStats {
  totalUniqueWords: number;
  totalOccurrences: number;
  totalSources: number;
}

export type SortOption = "frequency" | "alphabetical" | "recent";

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({
    totalUniqueWords: 0,
    totalOccurrences: 0,
    totalSources: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("frequency");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const allWords = await getAllVocabulary();

      // Calculate stats
      const totalOccurrences = allWords.reduce((sum, w) => sum + w.count, 0);
      const allSources = new Set(
        allWords.flatMap((w) => w.sources.map((s) => s.scriptId))
      );

      setStats({
        totalUniqueWords: allWords.length,
        totalOccurrences,
        totalSources: allSources.size,
      });

      setWords(allWords);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAllVocabulary = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearVocabulary();
      setWords([]);
      setStats({
        totalUniqueWords: 0,
        totalOccurrences: 0,
        totalSources: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sort and filter words
  const filteredWords = words
    .filter((word) =>
      searchQuery
        ? word.word.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      switch (sortBy) {
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

  // Load vocabulary on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    words: filteredWords,
    allWords: words,
    stats,
    isLoading,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    refresh,
    clearAllVocabulary,
  };
}
