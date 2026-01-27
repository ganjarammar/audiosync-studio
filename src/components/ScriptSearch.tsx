import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sentence, Word } from "@/types/caption";
import { formatTimestamp } from "@/lib/captionParser";
import { cn } from "@/lib/utils";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";

interface SearchResult {
  word: Word;
  sentence: Sentence;
  sentenceIndex: number;
  wordIndex: number;
}

interface ScriptSearchProps {
  sentences: Sentence[];
  onSeekTo: (time: number) => void;
  currentTime: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScriptSearch({ sentences, onSeekTo, currentTime, open, onOpenChange }: ScriptSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search for matching words
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    sentences.forEach((sentence, sentenceIndex) => {
      sentence.words.forEach((word, wordIndex) => {
        if (word.text.toLowerCase().includes(searchTerm)) {
          matches.push({
            word,
            sentence,
            sentenceIndex,
            wordIndex,
          });
        }
      });
    });

    return matches;
  }, [query, sentences]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const setOpen = onOpenChange;

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, results.length]);

  const handleSelect = useCallback((result: SearchResult) => {
    onSeekTo(result.word.startTime);
    setOpen(false);
  }, [onSeekTo]);

  const navigateResults = useCallback((direction: "up" | "down") => {
    if (results.length === 0) return;
    
    setSelectedIndex(prev => {
      if (direction === "down") {
        return prev < results.length - 1 ? prev + 1 : 0;
      } else {
        return prev > 0 ? prev - 1 : results.length - 1;
      }
    });
  }, [results.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateResults("down");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateResults("up");
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [navigateResults, handleSelect, results, selectedIndex]);

  // Get context around the word
  const getWordContext = (result: SearchResult) => {
    const words = result.sentence.words;
    const start = Math.max(0, result.wordIndex - 2);
    const end = Math.min(words.length, result.wordIndex + 3);
    
    return words.slice(start, end).map((w, i) => ({
      text: w.text,
      isMatch: start + i === result.wordIndex,
    }));
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Search script ({getModifierKey()}F)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent 
        className="w-[360px] p-0" 
        align="end"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in script..."
            className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[300px]">
          <div ref={resultsRef} className="p-2">
            {query.length >= 2 && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No matches found
              </p>
            )}
            
            {query.length < 2 && query.length > 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Type at least 2 characters
              </p>
            )}

            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {results.length} result{results.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => navigateResults("up")}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => navigateResults("down")}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {results.map((result, idx) => {
                  const context = getWordContext(result);
                  const isActive = result.word.startTime <= currentTime && 
                                   result.word.endTime >= currentTime;

                  return (
                    <button
                      key={`${result.sentenceIndex}-${result.wordIndex}`}
                      data-index={idx}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                        idx === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/50",
                        isActive && "border-l-2 border-primary"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(result.word.startTime)}
                        </span>
                        {isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Now
                          </Badge>
                        )}
                      </div>
                      <p className="leading-relaxed">
                        {context.map((c, i) => (
                          <span
                            key={i}
                            className={cn(
                              c.isMatch && "bg-primary/20 text-primary font-medium px-0.5 rounded"
                            )}
                          >
                            {c.text}{" "}
                          </span>
                        ))}
                      </p>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Keyboard hints */}
        {results.length > 0 && (
          <div className="border-t px-3 py-2 flex gap-4 text-[10px] text-muted-foreground">
            <span><kbd className="px-1 py-0.5 rounded bg-muted">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> jump</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted">Esc</kbd> close</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
