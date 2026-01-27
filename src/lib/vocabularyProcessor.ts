import { Script, VocabularyWord, WordSource } from "@/types/caption";
import {
  getVocabularyWord,
  saveVocabularyWord,
  isScriptProcessed,
  markScriptProcessed,
} from "./db";

/**
 * Cleans a word by removing leading/trailing punctuation
 * while keeping internal apostrophes for contractions
 */
function cleanWord(word: string): string {
  return word.toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '');
}

/**
 * Validates if a word should be included in vocabulary
 * - Must be at least 2 characters
 * - Must not be purely numeric
 */
function isValidWord(word: string): boolean {
  return word.length >= 2 && !/^\d+$/.test(word);
}

/**
 * Extracts all words from a script and counts their occurrences
 */
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

/**
 * Processes a script and updates the vocabulary database
 * Returns statistics about new and updated words
 * Skips if script was already processed to prevent duplicates
 */
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
      // Update existing word - increment count and add source
      await saveVocabularyWord({
        ...existing,
        count: existing.count + count,
        lastSeenAt: Date.now(),
        sources: [...existing.sources, source],
      });
      updatedWords++;
    } else {
      // Add new word
      await saveVocabularyWord({
        word,
        count,
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        sources: [source],
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
