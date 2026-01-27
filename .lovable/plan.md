

# Vocabulary Learning Library Implementation

## Overview

This plan implements a vocabulary tracking system that extracts words from SRT/script files, counts their occurrences across all projects, prevents duplicate counting from the same source file, and shows which files each word came from.

## What This Feature Does

When you upload and process a new script file:
1. All unique words are extracted and cleaned (lowercased, punctuation removed)
2. New words are added to your vocabulary library
3. Existing words get their count incremented
4. The system remembers which script files have been processed to prevent duplicates
5. Each word shows which source file(s) it came from

## Data Architecture

```text
VOCABULARY STORAGE (IndexedDB)

┌─────────────────────────────────────────────────────────────────┐
│  "vocabulary" object store                                      │
│  ─────────────────────────────────────────────────────────────  │
│  Key: word (lowercase string)                                   │
│                                                                 │
│  {                                                              │
│    word: "example",           // The word itself                │
│    count: 5,                  // Total occurrences across files │
│    firstSeenAt: 1705123456,   // Timestamp first encountered    │
│    lastSeenAt: 1705234567,    // Timestamp last encountered     │
│    sources: [                 // File-level references          │
│      { scriptId: "id1", fileName: "podcast_ep1.srt" },          │
│      { scriptId: "id2", fileName: "interview_2024.srt" }        │
│    ]                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  "processedScripts" object store                                │
│  ─────────────────────────────────────────────────────────────  │
│  Key: scriptId                                                  │
│                                                                 │
│  {                                                              │
│    scriptId: "abc-123",       // Same as script.id from db      │
│    fileName: "podcast_ep1.srt", // Original file name           │
│    processedAt: 1705123456,   // When vocabulary was extracted  │
│    wordCount: 150             // Total words extracted          │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Source Reference Structure

Each word tracks its sources at the FILE level only (not word position):

```text
Word: "technology"
├── Count: 12 (total times seen across all files)
└── Sources:
    ├── podcast_ep1.srt
    ├── interview_2024.srt
    └── lecture_notes.srt

UI Display:
┌─────────────────────────────────────────┐
│ technology                    ×12       │
│ Sources: podcast_ep1.srt, interview... │
└─────────────────────────────────────────┘
```

## Duplicate Prevention Logic

```text
User uploads "podcast_ep1.srt" → Script ID: "abc-123"
                    ↓
┌──────────────────────────────────────────────────────┐
│ Check: Is "abc-123" in processedScripts?             │
│                                                      │
│   NO  → Extract words → Update vocabulary → Mark as  │
│         processed                                    │
│                                                      │
│   YES → Skip vocabulary extraction (already counted) │
└──────────────────────────────────────────────────────┘
```

## Word Processing Rules

- Convert to lowercase: "Hello" → "hello"
- Remove punctuation: "world!" → "world"
- Keep contractions: "don't" → "don't"
- Remove numbers-only words: "123" → skipped
- Minimum length: 2+ characters

---

## Implementation Details

### 1. New Type Definitions

**File: `src/types/caption.ts`**

```typescript
export interface WordSource {
  scriptId: string;
  fileName: string;
}

export interface VocabularyWord {
  word: string;
  count: number;
  firstSeenAt: number;
  lastSeenAt: number;
  sources: WordSource[];  // File-level references only
}

export interface ProcessedScript {
  scriptId: string;
  fileName: string;
  processedAt: number;
  wordCount: number;
}
```

### 2. Database Schema Update

**File: `src/lib/db.ts`**

- Increment `DB_VERSION` from 1 to 2
- Add migration for new object stores:
  - `vocabulary` (keyPath: "word")
  - `processedScripts` (keyPath: "scriptId")
- Add CRUD functions:
  - `getVocabularyWord(word)`
  - `getAllVocabulary()`
  - `saveVocabularyWord(entry)`
  - `isScriptProcessed(scriptId)`
  - `markScriptProcessed(entry)`
  - `getVocabularyStats()`

### 3. Word Extraction Utility

**New File: `src/lib/vocabularyProcessor.ts`**

```typescript
export function extractWordsFromScript(script: Script): Map<string, number> {
  const wordCounts = new Map<string, number>();
  
  for (const sentence of script.sentences) {
    const words = sentence.text.split(/\s+/);
    for (const rawWord of words) {
      const cleaned = cleanWord(rawWord);
      if (isValidWord(cleaned)) {
        wordCounts.set(cleaned, (wordCounts.get(cleaned) || 0) + 1);
      }
    }
  }
  
  return wordCounts;
}

function cleanWord(word: string): string {
  // Remove leading/trailing punctuation, keep internal apostrophes
  return word.toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '');
}

function isValidWord(word: string): boolean {
  return word.length >= 2 && !/^\d+$/.test(word);
}
```

### 4. Vocabulary Update Function

**File: `src/lib/vocabularyProcessor.ts`**

```typescript
export async function processScriptForVocabulary(
  script: Script
): Promise<{ newWords: number; updatedWords: number; skipped: boolean }> {
  
  // Check if already processed
  if (await isScriptProcessed(script.id)) {
    return { newWords: 0, updatedWords: 0, skipped: true };
  }
  
  const wordCounts = extractWordsFromScript(script);
  const source: WordSource = { scriptId: script.id, fileName: script.name };
  
  let newWords = 0;
  let updatedWords = 0;
  
  for (const [word, count] of wordCounts) {
    const existing = await getVocabularyWord(word);
    
    if (existing) {
      await saveVocabularyWord({
        ...existing,
        count: existing.count + count,
        lastSeenAt: Date.now(),
        sources: [...existing.sources, source],  // Add file source
      });
      updatedWords++;
    } else {
      await saveVocabularyWord({
        word,
        count,
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        sources: [source],  // Initial source
      });
      newWords++;
    }
  }
  
  // Mark script as processed
  await markScriptProcessed({
    scriptId: script.id,
    fileName: script.name,
    processedAt: Date.now(),
    wordCount: wordCounts.size,
  });
  
  return { newWords, updatedWords, skipped: false };
}
```

### 5. Vocabulary Hook

**New File: `src/hooks/useVocabulary.ts`**

```typescript
export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [stats, setStats] = useState({ 
    totalUniqueWords: 0, 
    totalOccurrences: 0,
    totalSources: 0 
  });
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const allWords = await getAllVocabulary();
    // Sort by frequency (highest first)
    setWords(allWords.sort((a, b) => b.count - a.count));
    
    // Calculate stats
    const totalOccurrences = allWords.reduce((sum, w) => sum + w.count, 0);
    const allSources = new Set(allWords.flatMap(w => w.sources.map(s => s.scriptId)));
    
    setStats({
      totalUniqueWords: allWords.length,
      totalOccurrences,
      totalSources: allSources.size,
    });
    setIsLoading(false);
  }, []);

  return { words, stats, isLoading, refresh };
}
```

### 6. Vocabulary Display Component

**New File: `src/components/VocabularyLibrary.tsx`**

A slide-out sheet (similar to HistorySidebar) showing:

```text
┌─────────────────────────────────────────────────────┐
│  📚 Vocabulary Library                    [X Close] │
├─────────────────────────────────────────────────────┤
│  Stats: 1,234 words | 5,678 occurrences | 8 files   │
├─────────────────────────────────────────────────────┤
│  🔍 Search words...                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ technology                           ×12     │   │
│  │ Sources: podcast_ep1.srt, interview.srt      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ development                          ×8      │   │
│  │ Sources: lecture_notes.srt                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ... (scrollable list)                              │
└─────────────────────────────────────────────────────┘
```

Features:
- Search/filter words
- Show count badge
- Expandable source list (shows "podcast_ep1.srt, +2 more" if many sources)
- Sort by: frequency, alphabetical, recently added

### 7. Integration Points

**File: `src/hooks/useProject.ts`**

Add vocabulary processing after script save:

```typescript
// After saving script
await saveScript(scriptData);

// Process vocabulary
const vocabResult = await processScriptForVocabulary(scriptData);

// Could show toast: "Added 45 new words to library"
```

**File: `src/pages/Index.tsx`**

Add vocabulary button to header (Book icon):

```tsx
<VocabularyLibrary open={vocabOpen} onOpenChange={setVocabOpen} />
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/caption.ts` | Modify | Add VocabularyWord, WordSource, ProcessedScript interfaces |
| `src/lib/db.ts` | Modify | Upgrade DB version to 2, add vocabulary stores and CRUD |
| `src/lib/vocabularyProcessor.ts` | Create | Word extraction, cleaning, and vocabulary update logic |
| `src/hooks/useVocabulary.ts` | Create | React hook for vocabulary state |
| `src/hooks/useProject.ts` | Modify | Integrate vocabulary processing |
| `src/components/VocabularyLibrary.tsx` | Create | UI sheet to display word library with sources |
| `src/pages/Index.tsx` | Modify | Add vocabulary button to header |

---

## User Experience Flow

```text
1. User uploads audio + "podcast_ep1.srt"
2. Clicks "Generate Preview"
3. System processes files AND extracts vocabulary
4. Toast: "Added 245 new words to your library!"
5. User clicks 📚 button → sees vocabulary sheet
6. Each word shows count + source file names
7. If same file uploaded again → skipped (no duplicates)
```

