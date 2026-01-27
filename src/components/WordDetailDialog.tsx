import { format } from "date-fns";
import { Calendar, Hash, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { VocabularyWord } from "@/types/caption";

interface WordDetailDialogProps {
  word: VocabularyWord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordDetailDialog({
  word,
  open,
  onOpenChange,
}: WordDetailDialogProps) {
  if (!word) return null;

  const firstSeenDate = new Date(word.firstSeenAt);
  const lastSeenDate = new Date(word.lastSeenAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {word.word}
            <Badge variant="secondary" className="text-sm">
              ×{word.count}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Stats Row */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4" />
              <span>{word.count} occurrences</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>{word.sources.length} source{word.sources.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">First seen</p>
                <p className="font-medium">{format(firstSeenDate, "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last seen</p>
                <p className="font-medium">{format(lastSeenDate, "MMM d, yyyy")}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sources */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sources ({word.sources.length})
            </h4>
            <ScrollArea className="max-h-[150px]">
              <div className="flex flex-wrap gap-2">
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
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
