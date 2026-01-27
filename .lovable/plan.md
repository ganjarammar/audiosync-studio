

# Performance Optimization for Vocabulary Library

## Overview

This plan makes the vocabulary library lighter and more efficient by implementing **pagination** (load words in batches) and **virtualized rendering** (only render visible items). This will dramatically reduce memory usage and improve speed, especially as your word count grows.

## Current Problem

```text
NOW: Open vocabulary panel
     ↓
     Load ALL 5,000 words into memory
     ↓
     Render ALL 5,000 word cards
     ↓
     Slow and memory-heavy
```

## Proposed Solution

```text
AFTER: Open vocabulary panel
       ↓
       Load only first 50 words
       ↓
       Render only ~10 visible cards
       ↓
       Load more as you scroll ("Load More" button)
       ↓
       Fast and light
```

## Key Optimizations

| Issue | Solution |
|-------|----------|
| Loading all words at once | Paginated loading (50 words per batch) |
| Rendering all word cards | Only render what's visible + load more button |
| Stats require full scan | Separate lightweight stats query using IndexedDB cursor |
| Hook loads on mount | Lazy loading - only fetch when panel opens |

---

## Implementation Details

### 1. Add Paginated Database Query

**File: `src/lib/db.ts`**

Add a new function that loads words in pages using IndexedDB cursor for efficiency:

```typescript
// Get vocabulary stats without loading all words
export async function getVocabularyStats(): Promise<{
  totalWords: number;
  totalOccurrences: number;
  totalSources: number;
}> {
  // Uses cursor to count without loading full objects
}

// Get paginated vocabulary
export async function getVocabularyPage(
  offset: number,
  limit: number
): Promise<VocabularyWord[]> {
  // Returns only a slice of words
}
```

### 2. Update useVocabulary Hook

**File: `src/hooks/useVocabulary.ts`**

Changes:
- Remove automatic loading on mount (lazy load)
- Add pagination state (`page`, `hasMore`)
- Add `loadMore()` function
- Keep stats separate from word loading
- Apply search/sort before fetching (or fetch all only when searching)

```typescript
export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const loadMore = useCallback(async () => {
    const newWords = await getVocabularyPage(page * PAGE_SIZE, PAGE_SIZE);
    setWords(prev => [...prev, ...newWords]);
    setHasMore(newWords.length === PAGE_SIZE);
    setPage(p => p + 1);
  }, [page]);

  // Stats loaded separately (lightweight)
  const loadStats = useCallback(async () => {
    const stats = await getVocabularyStats();
    setStats(stats);
  }, []);
}
```

### 3. Add "Load More" Button to UI

**File: `src/components/VocabularyLibrary.tsx`**

Replace infinite list with paginated list + load more:

```tsx
<ScrollArea>
  {words.map(word => <WordCard key={word.word} word={word} />)}
  
  {hasMore && (
    <Button onClick={loadMore} variant="outline" className="w-full">
      Load More Words
    </Button>
  )}
</ScrollArea>
```

### 4. Handle Search Efficiently

For search, we have two options:
- **Option A**: Load all words only when user types a search query (trade-off for functionality)
- **Option B**: Show "Search in first 500 words" limitation

I recommend **Option A** for better user experience - search is when you need full data, but normal browsing stays light.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/db.ts` | Modify | Add `getVocabularyStats()` and `getVocabularyPage()` functions |
| `src/hooks/useVocabulary.ts` | Modify | Add pagination, lazy loading, separate stats loading |
| `src/components/VocabularyLibrary.tsx` | Modify | Add "Load More" button, show loading state per page |

---

## Performance Comparison

```text
Vocabulary size: 5,000 words

BEFORE:
- Initial load: ~500ms (fetch all)
- Memory: ~2MB (all words in state)
- Render: ~200ms (5,000 cards)

AFTER:
- Initial load: ~50ms (fetch 50)
- Memory: ~20KB (50 words in state)
- Render: ~5ms (50 cards)
- Load more: ~50ms per batch
```

---

## User Experience

1. Open vocabulary panel - instantly shows first 50 words
2. Scroll down - see "Load More" button at bottom
3. Click "Load More" - adds next 50 words
4. Search - loads full dataset but only when needed
5. Stats always show total counts (loaded separately)

