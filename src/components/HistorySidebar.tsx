import { useEffect, useState, useMemo } from "react";
import { History, Play, Trash2, Clock, Music, ArrowUpAZ, ArrowDownAZ, ArrowUp, ArrowDown, Star } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistory, LoadedProject } from "@/hooks/useHistory.ts";
import { Project } from "@/types/caption";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";

type SortOption = "name-desc" | "name-asc" | "date-desc" | "date-asc" | "favorites";
type FilterOption = "all" | "favorites";

const SORT_STORAGE_KEY = "history-sort";
const FILTER_STORAGE_KEY = "history-filter";

interface HistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadProject: (loaded: LoadedProject, autoPlay?: boolean) => void;
}

export function HistorySidebar({ open, onOpenChange, onLoadProject }: HistorySidebarProps) {
  const { projects, isLoading, refreshProjects, loadProject, removeProject, toggleFavorite } = useHistory();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    return (stored as SortOption) || "name-desc";
  });
  const [filterBy, setFilterBy] = useState<FilterOption>(() => {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    return (stored as FilterOption) || "all";
  });

  useEffect(() => {
    if (open) {
      refreshProjects();
    }
  }, [open, refreshProjects]);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    localStorage.setItem(SORT_STORAGE_KEY, option);
  };

  const handleFilterChange = (option: FilterOption) => {
    setFilterBy(option);
    localStorage.setItem(FILTER_STORAGE_KEY, option);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    await toggleFavorite(projectId);
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Apply filter
    if (filterBy === "favorites") {
      filtered = filtered.filter((p) => p.isFavorite);
    }
    
    // Apply sort
    return filtered.sort((a, b) => {
      // Favorites first option
      if (sortBy === "favorites") {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (b.lastPlayedAt || b.createdAt) - (a.lastPlayedAt || a.createdAt);
      }
      
      switch (sortBy) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "date-desc":
          return (b.lastPlayedAt || b.createdAt) - (a.lastPlayedAt || a.createdAt);
        case "date-asc":
          return (a.lastPlayedAt || a.createdAt) - (b.lastPlayedAt || b.createdAt);
        default:
          return 0;
      }
    });
  }, [projects, sortBy, filterBy]);

  const favoriteCount = useMemo(() => projects.filter((p) => p.isFavorite).length, [projects]);

  const handleLoad = async (project: Project, autoPlay = false) => {
    const loaded = await loadProject(project.id);
    if (loaded) {
      onLoadProject(loaded, autoPlay);
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
      <TooltipProvider>
        <Tooltip>
          <SheetTrigger asChild>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </SheetTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">History ({getModifierKey()}H)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent className="glass border-border/50 w-80">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              History
            </SheetTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  {sortBy === "name-desc" && <ArrowDownAZ className="h-4 w-4" />}
                  {sortBy === "name-asc" && <ArrowUpAZ className="h-4 w-4" />}
                  {sortBy === "date-desc" && <ArrowDown className="h-4 w-4" />}
                  {sortBy === "date-asc" && <ArrowUp className="h-4 w-4" />}
                  {sortBy === "favorites" && <Star className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortChange("favorites")} className={sortBy === "favorites" ? "bg-accent" : ""}>
                  <Star className="h-4 w-4 mr-2" />
                  Favorites first
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSortChange("name-desc")} className={sortBy === "name-desc" ? "bg-accent" : ""}>
                  <ArrowDownAZ className="h-4 w-4 mr-2" />
                  Name (Z → A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("name-asc")} className={sortBy === "name-asc" ? "bg-accent" : ""}>
                  <ArrowUpAZ className="h-4 w-4 mr-2" />
                  Name (A → Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("date-desc")} className={sortBy === "date-desc" ? "bg-accent" : ""}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Newest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("date-asc")} className={sortBy === "date-asc" ? "bg-accent" : ""}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Oldest first
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <SheetDescription>
            Your saved projects. Click to load.
          </SheetDescription>
        </SheetHeader>

        {/* Filter Tabs */}
        <Tabs value={filterBy} onValueChange={(v) => handleFilterChange(v as FilterOption)} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Favorites ({favoriteCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="h-[calc(100vh-200px)] mt-4 -mx-2 px-2">
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
              {filteredAndSortedProjects.map((project) => (
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
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        {project.isFavorite && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
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
                      className={cn(
                        "h-7 w-7",
                        project.isFavorite 
                          ? "text-amber-500 hover:bg-amber-500/20" 
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      onClick={(e) => handleToggleFavorite(e, project.id)}
                    >
                      <Star className={cn("h-3.5 w-3.5", project.isFavorite && "fill-current")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(project, true);
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
