import { useEffect, useState, useMemo } from "react";
import { ListMusic, Play, Trash2, Clock, Music, ArrowUpAZ, ArrowDownAZ, ArrowUp, ArrowDown, Star, FolderOpen, RefreshCw, CheckCircle2, AlertCircle, Search, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistory, LoadedProject } from "@/hooks/useHistory.ts";
import { useFolderLoader } from "@/hooks/useFolderLoader";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types/caption";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { getListeningCount } from "@/lib/db";

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
  const { projects, isLoading: isHistoryLoading, refreshProjects, loadProject, removeProject, toggleFavorite } = useHistory();
  const { loadFolder, refreshFolder, isLoading: isFolderLoading, progress, stats, resetStats, lastFolderPath } = useFolderLoader(refreshProjects);
  const isLoading = isHistoryLoading || isFolderLoading;

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    return (stored as SortOption) || "name-desc";
  });
  const [filterBy, setFilterBy] = useState<FilterOption>(() => {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    return (stored as FilterOption) || "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [listeningCounts, setListeningCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      refreshProjects();
    }
  }, [open, refreshProjects]);

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const project of projects) {
        if (project.audioName) {
          counts[project.audioName] = await getListeningCount(project.audioName);
        }
      }
      setListeningCounts(counts);
    };

    if (open && projects.length > 0) {
      fetchCounts();
    }
  }, [open, projects]);

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

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query)
      );
    }

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
          return b.name.localeCompare(a.name, undefined, { numeric: true });
        case "name-asc":
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        case "date-desc":
          return (b.lastPlayedAt || b.createdAt) - (a.lastPlayedAt || a.createdAt);
        case "date-asc":
          return (a.lastPlayedAt || a.createdAt) - (b.lastPlayedAt || b.createdAt);
        default:
          return 0;
      }
    });
  }, [projects, sortBy, filterBy, searchQuery]);

  const favoriteCount = useMemo(() => projects.filter((p) => p.isFavorite).length, [projects]);

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/20 transition-colors">
                <ListMusic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </SheetTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Playlist ({getModifierKey()}P)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent
        className="glass border-border/50 w-[400px] sm:w-[540px] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-primary" />
              Playlist
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={loadFolder}
                    disabled={isLoading}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load folder</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={refreshFolder}
                    disabled={isLoading || !lastFolderPath}
                  >
                    <RefreshCw className={cn("h-4 w-4", isFolderLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh last folder</TooltipContent>
              </Tooltip>

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

        {/* Search Bar */}
        <div className="mt-4 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-card/50 border-border/50 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-250px)] mt-4 -mx-2 px-2">
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
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(project.duration)}</span>
                        </div>
                        {project.audioName && listeningCounts[project.audioName] > 0 && (
                          <div className="flex items-center gap-1 text-primary/70">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Listened {listeningCounts[project.audioName]}x</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <AlertDialog open={isFolderLoading || !!stats} onOpenChange={(open) => !open && resetStats()}>
          <AlertDialogContent className="glass border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isFolderLoading ? "Importing Files..." : "Import Complete"}
              </AlertDialogTitle>
              <div className="py-4">
                {isFolderLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Processing files...</span>
                      <span>{progress ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                    </div>
                    <Progress value={progress ? (progress.current / progress.total) * 100 : 0} />
                    <p className="text-xs text-muted-foreground truncate">
                      Current file: {progress?.filename || "..."}
                    </p>
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
                        <div className="text-2xl font-bold">{stats.processed}</div>
                        <div className="text-xs text-muted-foreground">Imported</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <div className="text-2xl font-bold">{stats.skipped}</div>
                        <div className="text-xs text-muted-foreground">Skipped (Duplicate)</div>
                      </div>
                    </div>
                    {stats.errors > 0 && (
                      <p className="text-sm text-destructive text-center">
                        {stats.errors} files failed to import.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </AlertDialogHeader>
            {!isFolderLoading && (
              <AlertDialogFooter>
                <AlertDialogAction onClick={resetStats}>Done</AlertDialogAction>
              </AlertDialogFooter>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
