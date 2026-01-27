import { useMemo, useRef, useState, useEffect, useCallback } from "react";
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

const GAP_SIZE = 32; // space-y-8 = 32px
const CONTAINER_HEIGHT = 400;
const PADDING = 64; // p-8 = 32px * 2
const AVAILABLE_HEIGHT = CONTAINER_HEIGHT - PADDING;

function WordHighlight({ word, isActive, isPast, currentTime }: WordHighlightProps) {
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

function SentenceRenderer({ sentence }: { sentence: Sentence }) {
  return (
    <>
      {sentence.words.map((word, wordIdx) => (
        <span key={`${wordIdx}-${word.startTime}`} className="inline-block py-0.5 px-1">
          <span className="text-foreground/70">{word.text}</span>
        </span>
      ))}
    </>
  );
}

export function CaptionDisplay({ sentences, currentTime }: CaptionDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [heightMap, setHeightMap] = useState<Map<number, number>>(new Map());
  const [containerWidth, setContainerWidth] = useState(0);

  const { sentence: currentSentence, wordIndex: currentWordIndex } = useMemo(
    () => findCurrentWord(sentences, currentTime),
    [sentences, currentTime]
  );

  const currentSentenceIndex = useMemo(() => {
    if (!currentSentence) return -1;
    return sentences.findIndex(s => s === currentSentence);
  }, [sentences, currentSentence]);

  // Measure sentence heights
  const measureHeights = useCallback(() => {
    if (!measureRef.current || sentences.length === 0) return;

    const newHeightMap = new Map<number, number>();
    const measureDiv = measureRef.current;

    sentences.forEach((sentence, index) => {
      // Clear and render sentence
      measureDiv.innerHTML = '';
      const sentenceDiv = document.createElement('div');
      sentenceDiv.className = 'text-center text-2xl md:text-3xl leading-relaxed';
      
      sentence.words.forEach(word => {
        const span = document.createElement('span');
        span.className = 'inline-block py-0.5 px-1';
        span.textContent = word.text;
        sentenceDiv.appendChild(span);
      });
      
      measureDiv.appendChild(sentenceDiv);
      newHeightMap.set(index, sentenceDiv.offsetHeight);
    });

    measureDiv.innerHTML = '';
    setHeightMap(newHeightMap);
  }, [sentences]);

  // ResizeObserver to handle width changes
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const newWidth = entry.contentRect.width;
        if (newWidth !== containerWidth) {
          setContainerWidth(newWidth);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerWidth]);

  // Re-measure when sentences change or width changes
  useEffect(() => {
    measureHeights();
  }, [measureHeights, containerWidth]);

  // Calculate which sentences fit
  const visibleSentences = useMemo(() => {
    if (sentences.length === 0 || heightMap.size === 0) return [];
    
    const result: { sentence: Sentence; originalIndex: number }[] = [];
    let remainingHeight = AVAILABLE_HEIGHT;
    
    // Always include current sentence first
    const effectiveCurrentIndex = currentSentenceIndex >= 0 ? currentSentenceIndex : 0;
    const currentHeight = heightMap.get(effectiveCurrentIndex) || 60;
    
    result.push({
      sentence: sentences[effectiveCurrentIndex],
      originalIndex: effectiveCurrentIndex,
    });
    remainingHeight -= currentHeight;

    // Try to add previous sentence
    if (effectiveCurrentIndex > 0) {
      const prevHeight = heightMap.get(effectiveCurrentIndex - 1) || 60;
      if (remainingHeight >= prevHeight + GAP_SIZE) {
        result.unshift({
          sentence: sentences[effectiveCurrentIndex - 1],
          originalIndex: effectiveCurrentIndex - 1,
        });
        remainingHeight -= (prevHeight + GAP_SIZE);
      }
    }

    // Try to add next sentence
    if (effectiveCurrentIndex < sentences.length - 1) {
      const nextHeight = heightMap.get(effectiveCurrentIndex + 1) || 60;
      if (remainingHeight >= nextHeight + GAP_SIZE) {
        result.push({
          sentence: sentences[effectiveCurrentIndex + 1],
          originalIndex: effectiveCurrentIndex + 1,
        });
        remainingHeight -= (nextHeight + GAP_SIZE);
      }
    }

    // Try to add more context if space permits
    const firstVisibleIndex = result[0].originalIndex;
    const lastVisibleIndex = result[result.length - 1].originalIndex;

    // Add earlier sentences
    let prevIdx = firstVisibleIndex - 1;
    while (prevIdx >= 0 && remainingHeight > 0) {
      const height = heightMap.get(prevIdx) || 60;
      if (remainingHeight >= height + GAP_SIZE) {
        result.unshift({
          sentence: sentences[prevIdx],
          originalIndex: prevIdx,
        });
        remainingHeight -= (height + GAP_SIZE);
        prevIdx--;
      } else {
        break;
      }
    }

    // Add later sentences
    let nextIdx = lastVisibleIndex + 1;
    while (nextIdx < sentences.length && remainingHeight > 0) {
      const height = heightMap.get(nextIdx) || 60;
      if (remainingHeight >= height + GAP_SIZE) {
        result.push({
          sentence: sentences[nextIdx],
          originalIndex: nextIdx,
        });
        remainingHeight -= (height + GAP_SIZE);
        nextIdx++;
      } else {
        break;
      }
    }

    return result;
  }, [sentences, currentSentenceIndex, heightMap]);

  // Determine if we should center (not first sentence)
  const shouldCenter = currentSentenceIndex > 0;

  if (sentences.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl glass p-8">
        <p className="text-muted-foreground">Upload a script file to see captions</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-[400px] overflow-hidden rounded-2xl glass"
    >
      {/* Hidden measurement div */}
      <div 
        ref={measureRef}
        className="invisible absolute left-0 right-0 top-0 p-8 md:p-12"
        aria-hidden="true"
        style={{ pointerEvents: 'none' }}
      />

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-12 bg-gradient-to-b from-card/80 to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent z-10" />

      {/* Content area */}
      <div 
        className={cn(
          "flex flex-col h-full p-8 md:p-12",
          shouldCenter ? "justify-center" : "justify-start pt-12"
        )}
      >
        <div className="space-y-8">
          {visibleSentences.map(({ sentence, originalIndex }) => {
            const isCurrent = originalIndex === currentSentenceIndex;
            const isPastSentence = originalIndex < currentSentenceIndex;

            return (
              <div
                key={`${originalIndex}-${sentence.startTime}`}
                className={cn(
                  "text-center text-2xl md:text-3xl leading-relaxed transition-all duration-500",
                  isCurrent && "scale-100",
                  !isCurrent && "scale-75 origin-center",
                  !isCurrent && !isPastSentence && "opacity-30",
                  isPastSentence && "opacity-20"
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
    </div>
  );
}
