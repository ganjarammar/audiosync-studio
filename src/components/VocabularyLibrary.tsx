import { useState } from "react";
import { Book, Search, Trash2, ArrowUpDown } from "lucide-react";
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

interface VocabularyLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WordCard({ word }: { word: VocabularyWord }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sourceCount = word.sources.length;
  const displaySources = word.sources.slice(0, 2);
  const hasMoreSources = sourceCount > 2;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{word.word}</span>
        <Badge variant="secondary" className="text-xs">
          ×{word.count}
        </Badge>
      </div>

      <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Sources:</span>
          {!sourcesOpen && (
            <>
              <span className="truncate max-w-[150px]">
                {displaySources.map((s) => s.fileName).join(", ")}
              </span>
              {hasMoreSources && (
                <CollapsibleTrigger asChild>
                  <button className="text-primary hover:underline ml-1">
                    +{sourceCount - 2} more
                  </button>
                </CollapsibleTrigger>
              )}
            </>
          )}
          {sourcesOpen && (
            <CollapsibleTrigger asChild>
              <button className="text-primary hover:underline">
                hide
              </button>
            </CollapsibleTrigger>
          )}
        </div>
        <CollapsibleContent className="mt-2">
          <div className="flex flex-wrap gap-1">
            {word.sources.map((source, idx) => (
              <Badge
                key={`${source.scriptId}-${idx}`}
                variant="outline"
                className="text-xs"
              >
                {source.fileName}
              </Badge>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
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
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    refresh,
    clearAllVocabulary,
  } = useVocabulary();

  const handleClear = async () => {
    await clearAllVocabulary();
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
                <WordCard key={word.word} word={word} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
