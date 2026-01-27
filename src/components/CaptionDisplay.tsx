import { useMemo } from "react";
import { Sentence, Word } from "@/types/caption";
import { findCurrentWord } from "@/lib/captionParser";
import { cn } from "@/lib/utils";

interface CaptionDisplayProps {
  sentences: Sentence[];
  currentTime: number;
}

interface WordHighlightProps {
  word: Word;
  isActive: boolean;
  isPast: boolean;
  currentTime: number;
}

function WordHighlight({ word, isActive, isPast, currentTime }: WordHighlightProps) {
  // Calculate progress through the word (0-1)
  const progress = useMemo(() => {
    if (!isActive) return isPast ? 1 : 0;
    const wordDuration = word.endTime - word.startTime;
    if (wordDuration <= 0) return 1;
    return Math.min(1, Math.max(0, (currentTime - word.startTime) / wordDuration));
  }, [isActive, isPast, currentTime, word.startTime, word.endTime]);

  return (
    <span
      className={cn(
        "relative inline-block py-0.5 transition-all duration-150",
        isActive ? "px-4 scale-110" : "px-1"
      )}
    >
      <span className="relative">
        <span
          className={cn(
            "relative z-10 transition-all duration-150",
            isActive && "text-primary glow-text font-semibold",
            isPast && "text-muted-foreground",
            !isActive && !isPast && "text-foreground/70"
          )}
        >
          {word.text}
        </span>
        {isActive && (
          <span
            className="absolute bottom-0 left-0 h-0.5 rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        )}
      </span>
    </span>
  );
}

export function CaptionDisplay({ sentences, currentTime }: CaptionDisplayProps) {
  const { sentence: currentSentence, wordIndex: currentWordIndex } = useMemo(
    () => findCurrentWord(sentences, currentTime),
    [sentences, currentTime]
  );

  // Find the sentence index
  const currentSentenceIndex = useMemo(() => {
    if (!currentSentence) return -1;
    return sentences.findIndex(s => s === currentSentence);
  }, [sentences, currentSentence]);

  // Show a window of sentences around the current one
  const visibleSentences = useMemo(() => {
    if (sentences.length === 0) return [];
    
    const windowSize = 3; // Show 3 sentences at a time
    let startIdx = 0;
    
    if (currentSentenceIndex >= 0) {
      startIdx = Math.max(0, currentSentenceIndex - 1);
    }
    
    return sentences.slice(startIdx, startIdx + windowSize).map((s, i) => ({
      sentence: s,
      originalIndex: startIdx + i,
    }));
  }, [sentences, currentSentenceIndex]);

  if (sentences.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl glass p-12">
        <p className="text-muted-foreground">Upload a script file to see captions</p>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] overflow-hidden rounded-2xl glass p-8 md:p-12">
      {/* Gradient overlays for smooth transitions */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-12 bg-gradient-to-b from-card/80 to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent z-10" />

      <div className="space-y-8">
        {visibleSentences.map(({ sentence, originalIndex }) => {
          const isCurrent = originalIndex === currentSentenceIndex;
          const isPastSentence = originalIndex < currentSentenceIndex;

          return (
            <div
              key={`${originalIndex}-${sentence.startTime}`}
              className={cn(
                "text-center leading-relaxed transition-all duration-500",
                isCurrent && "text-3xl md:text-4xl",
                isPastSentence && "text-lg md:text-xl opacity-40",
                !isCurrent && !isPastSentence && "text-lg md:text-xl opacity-50"
              )}
            >
              {sentence.words.map((word, wordIdx) => {
                const isActiveWord = isCurrent && wordIdx === currentWordIndex;
                const isPastWord = isPastSentence || (isCurrent && wordIdx < currentWordIndex);

                return (
                  <WordHighlight
                    key={`${wordIdx}-${word.startTime}`}
                    word={word}
                    isActive={isActiveWord}
                    isPast={isPastWord}
                    currentTime={currentTime}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
