import { useState, useEffect, useCallback } from "react";
import { PlayCircle, Sparkles, Shuffle, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  getLastPlayedProject,
  getRecentlyAddedProjects,
  getRandomProject,
  getAudio,
  getScript,
  saveProject,
} from "@/lib/db";
import { Project, AudioFile, Script } from "@/types/caption";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";

export interface QuickLoadedProject {
  project: Project;
  audio: AudioFile;
  script: Script;
  seekToPosition?: number;
}

interface QuickActionsMenuProps {
  onQuickLoad: (loaded: QuickLoadedProject) => void;
}

export function QuickActionsMenu({ onQuickLoad }: QuickActionsMenuProps) {
  const [lastPlayed, setLastPlayed] = useState<Project | null>(null);
  const [hasProjects, setHasProjects] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch last played project for hint display
  useEffect(() => {
    const fetchLastPlayed = async () => {
      const project = await getLastPlayedProject();
      setLastPlayed(project);
      setHasProjects(!!project);
    };
    fetchLastPlayed();
  }, []);

  const loadProjectWithResources = useCallback(
    async (project: Project, seekToSaved = false): Promise<boolean> => {
      setIsLoading(true);
      try {
        const [audio, script] = await Promise.all([
          getAudio(project.audioId),
          getScript(project.scriptId),
        ]);

        if (!audio || !script) return false;

        // Update lastPlayedAt
        const updatedProject: Project = {
          ...project,
          lastPlayedAt: Date.now(),
        };
        await saveProject(updatedProject);

        onQuickLoad({
          project: updatedProject,
          audio,
          script,
          seekToPosition: seekToSaved ? project.lastPosition : undefined,
        });

        // Refresh last played
        setLastPlayed(updatedProject);
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [onQuickLoad]
  );

  const handleContinueListening = useCallback(async () => {
    const project = await getLastPlayedProject();
    if (project) {
      await loadProjectWithResources(project, true);
    }
  }, [loadProjectWithResources]);

  const handleRecentlyAdded = useCallback(async () => {
    const projects = await getRecentlyAddedProjects(1);
    if (projects.length > 0) {
      await loadProjectWithResources(projects[0], false);
    }
  }, [loadProjectWithResources]);

  const handlePlayRandomly = useCallback(async () => {
    const project = await getRandomProject();
    if (project) {
      await loadProjectWithResources(project, false);
    }
  }, [loadProjectWithResources]);

  if (!hasProjects) {
    return null; // Hide menu when no projects exist
  }

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Quick Actions ({getModifierKey()}Q)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleContinueListening}
          disabled={!lastPlayed || isLoading}
          className="flex items-start gap-3 py-2.5"
        >
          <PlayCircle className="h-4 w-4 mt-0.5 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium">Continue Listening</span>
            {lastPlayed && (
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {lastPlayed.name}
              </span>
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleRecentlyAdded}
          disabled={isLoading}
          className="flex items-center gap-3 py-2.5"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Recently Added</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handlePlayRandomly}
          disabled={isLoading}
          className="flex items-center gap-3 py-2.5"
        >
          <Shuffle className="h-4 w-4 text-emerald-500" />
          <span>Play Randomly</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
