import { useState, useEffect } from "react";
import { Book, Search, Trash2, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useVocabulary, SortOption } from "@/hooks/useVocabulary";
import { VocabularyWord } from "@/types/caption";
import { WordDetailDialog } from "@/components/WordDetailDialog";

interface VocabularyLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WordCardProps {
  word: VocabularyWord;
  onClick: () => void;
}

function WordCard({ word, onClick }: WordCardProps) {
  const sourceCount = word.sources.length;
  const displaySources = word.sources.slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card p-3 space-y-2 hover:bg-accent/50 hover:border-primary/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{word.word}</span>
        <Badge variant="secondary" className="text-xs">
          ×{word.count}
        </Badge>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Sources:</span>
        <span className="truncate max-w-[200px]">
          {displaySources.map((s) => s.fileName).join(", ")}
          {sourceCount > 2 && ` +${sourceCount - 2} more`}
        </span>
      </div>
    </button>
  );
}

export function VocabularyLibrary({
  open,
  onOpenChange,
}: VocabularyLibraryProps) {
  const {
    words,
    stats,
    isLoading,
    isLoadingMore,
    hasMore,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
    clearAllVocabulary,
  } = useVocabulary();

  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Refresh vocabulary when sheet opens
  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  const handleClear = async () => {
    await clearAllVocabulary();
  };

  const handleWordClick = (word: VocabularyWord) => {
    setSelectedWord(word);
    setDetailOpen(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Book className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Vocabulary Library
          </SheetTitle>
          <SheetDescription>
            {stats.totalUniqueWords} words · {stats.totalOccurrences} occurrences · {stats.totalSources} files
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 mt-4">
          {/* Search and Sort */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear All Button */}
          {stats.totalUniqueWords > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-fit gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all vocabulary?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {stats.totalUniqueWords} words from your vocabulary library. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Word List */}
        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : words.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Book className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No words match your search"
                  : "No vocabulary yet. Upload and process a script to start building your library."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {words.map((word) => (
                <WordCard key={word.word} word={word} onClick={() => handleWordClick(word)} />
              ))}
              
              {/* Load More Button */}
              {hasMore && !searchQuery && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Words"
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>

        <WordDetailDialog
          word={selectedWord}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </SheetContent>
    </Sheet>
  );
}
