import { useEffect, useState } from "react";
import { History, Play, Trash2, Clock, Music } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHistory, LoadedProject } from "@/hooks/useHistory.ts";
import { Project } from "@/types/caption";

interface HistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadProject: (loaded: LoadedProject) => void;
}

export function HistorySidebar({ open, onOpenChange, onLoadProject }: HistorySidebarProps) {
  const { projects, isLoading, refreshProjects, loadProject, removeProject } = useHistory();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (open) {
      refreshProjects();
    }
  }, [open, refreshProjects]);

  const handleLoad = async (project: Project) => {
    const loaded = await loadProject(project.id);
    if (loaded) {
      onLoadProject(loaded);
      onOpenChange(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      await removeProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="glass border-border/50 w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            History
          </SheetTitle>
          <SheetDescription>
            Your saved projects. Click to load.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-6 -mx-2 px-2">
          {isLoading && projects.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Upload audio & script to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleLoad(project)}
                  className="group relative rounded-lg border border-border/50 bg-card/50 p-3 cursor-pointer hover:bg-accent/50 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Music className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(project.lastPlayedAt || project.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(project);
                      }}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/20"
                      onClick={(e) => handleDeleteClick(e, project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent className="glass border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
