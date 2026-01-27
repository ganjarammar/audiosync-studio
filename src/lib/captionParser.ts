import { Sentence, Word } from "@/types/caption";

/**
 * Parses a script file with sentence-level timestamps and generates word-level timestamps
 * using forced alignment (interpolation based on word length)
 * 
 * Expected format:
 * [00:00:00.000 - 00:00:05.500] This is the first sentence.
 * [00:00:05.500 - 00:00:10.000] This is the second sentence.
 */

export function parseTimestamp(timestamp: string): number {
  // Handle formats: HH:MM:SS.mmm, MM:SS.mmm, or SS.mmm
  const parts = timestamp.trim().split(":");
  
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseFloat(seconds)
    );
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  } else {
    return parseFloat(parts[0]);
  }
}

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(3);
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.padStart(6, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.padStart(6, "0")}`;
}

export function interpolateWordTimestamps(
  text: string,
  startTime: number,
  endTime: number
): Word[] {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  const duration = endTime - startTime;
  
  // Calculate word weights based on character length (longer words take more time)
  const weights = words.map(word => word.length);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  const result: Word[] = [];
  let currentTime = startTime;
  
  for (let i = 0; i < words.length; i++) {
    const wordDuration = (weights[i] / totalWeight) * duration;
    const wordEndTime = currentTime + wordDuration;
    
    result.push({
      text: words[i],
      startTime: currentTime,
      endTime: wordEndTime,
    });
    
    currentTime = wordEndTime;
  }
  
  return result;
}

export function parseScript(content: string): Sentence[] {
  const lines = content.trim().split("\n");
  const sentences: Sentence[] = [];
  
  // Pattern: [timestamp - timestamp] text
  const pattern = /\[([^\]]+)\s*-\s*([^\]]+)\]\s*(.+)/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(pattern);
    if (match) {
      const [, startStr, endStr, text] = match;
      const startTime = parseTimestamp(startStr);
      const endTime = parseTimestamp(endStr);
      
      const words = interpolateWordTimestamps(text, startTime, endTime);
      
      sentences.push({
        text: text.trim(),
        startTime,
        endTime,
        words,
      });
    }
  }
  
  return sentences;
}

export function findCurrentWord(
  sentences: Sentence[],
  currentTime: number
): { sentence: Sentence | null; wordIndex: number; word: Word | null } {
  for (const sentence of sentences) {
    if (currentTime >= sentence.startTime && currentTime <= sentence.endTime) {
      for (let i = 0; i < sentence.words.length; i++) {
        const word = sentence.words[i];
        if (currentTime >= word.startTime && currentTime <= word.endTime) {
          return { sentence, wordIndex: i, word };
        }
      }
      // If between words, find closest
      for (let i = 0; i < sentence.words.length; i++) {
        if (currentTime < sentence.words[i].startTime) {
          return { sentence, wordIndex: Math.max(0, i - 1), word: sentence.words[Math.max(0, i - 1)] };
        }
      }
      return { sentence, wordIndex: sentence.words.length - 1, word: sentence.words[sentence.words.length - 1] };
    }
  }
  return { sentence: null, wordIndex: -1, word: null };
}
