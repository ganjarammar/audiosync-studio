import { useState, useEffect, useCallback } from "react";
import { PlayCircle, Sparkles, Shuffle, Loader2 } from "lucide-react";
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

export interface QuickLoadedProject {
  project: Project;
  audio: AudioFile;
  script: Script;
  seekToPosition?: number;
}

interface QuickActionsBarProps {
  onQuickLoad: (loaded: QuickLoadedProject) => void;
  refreshTrigger?: string | null; // Triggers refresh when changed (e.g., currentProjectId)
}

export function QuickActionsBar({ onQuickLoad, refreshTrigger }: QuickActionsBarProps) {
  const [lastPlayed, setLastPlayed] = useState<Project | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Project | null>(null);
  const [hasProjects, setHasProjects] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Fetch last played and recently added projects for hint display
  useEffect(() => {
    const fetchProjects = async () => {
      const [lastPlayedProject, recentProjects] = await Promise.all([
        getLastPlayedProject(),
        getRecentlyAddedProjects(1),
      ]);
      setLastPlayed(lastPlayedProject);
      setRecentlyAdded(recentProjects.length > 0 ? recentProjects[0] : null);
      setHasProjects(!!lastPlayedProject || recentProjects.length > 0);
    };
    fetchProjects();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const loadProjectWithResources = useCallback(
    async (project: Project, seekToSaved = false): Promise<boolean> => {
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
        setIsLoading(null);
      }
    },
    [onQuickLoad]
  );

  const handleContinueListening = useCallback(async () => {
    setIsLoading("continue");
    const project = await getLastPlayedProject();
    if (project) {
      await loadProjectWithResources(project, true);
    } else {
      setIsLoading(null);
    }
  }, [loadProjectWithResources]);

  const handleRecentlyAdded = useCallback(async () => {
    setIsLoading("recent");
    const projects = await getRecentlyAddedProjects(1);
    if (projects.length > 0) {
      await loadProjectWithResources(projects[0], false);
    } else {
      setIsLoading(null);
    }
  }, [loadProjectWithResources]);

  const handlePlayRandomly = useCallback(async () => {
    setIsLoading("random");
    const project = await getRandomProject();
    if (project) {
      await loadProjectWithResources(project, false);
    } else {
      setIsLoading(null);
    }
  }, [loadProjectWithResources]);

  if (!hasProjects) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full">
      {/* Continue Listening - Primary action */}
      <Button
        onClick={handleContinueListening}
        disabled={!lastPlayed || isLoading !== null}
        className="flex-1 sm:flex-initial gap-3 py-6 px-6 gradient-primary text-primary-foreground rounded-xl hover:scale-[1.02] transition-all duration-200"
      >
        {isLoading === "continue" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <PlayCircle className="h-5 w-5" />
        )}
        <div className="flex flex-col items-start">
          <span className="font-medium">Continue Listening</span>
          {lastPlayed && (
            <span className="text-xs opacity-80 truncate max-w-[140px]">
              {lastPlayed.name}
            </span>
          )}
        </div>
      </Button>

      {/* Recently Added */}
      <Button
        onClick={handleRecentlyAdded}
        disabled={isLoading !== null}
        variant="outline"
        className="flex-1 sm:flex-initial gap-3 py-6 px-6 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:scale-[1.02] transition-all duration-200"
      >
        {isLoading === "recent" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5 text-amber-500" />
        )}
        <div className="flex flex-col items-start">
          <span className="font-medium">Recently Added</span>
          {recentlyAdded && (
            <span className="text-xs opacity-80 truncate max-w-[140px]">
              {recentlyAdded.name}
            </span>
          )}
        </div>
      </Button>

      {/* Play Randomly */}
      <Button
        onClick={handlePlayRandomly}
        disabled={isLoading !== null}
        variant="outline"
        className="flex-1 sm:flex-initial gap-3 py-6 px-6 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:scale-[1.02] transition-all duration-200"
      >
        {isLoading === "random" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Shuffle className="h-5 w-5 text-emerald-500" />
        )}
        <span className="font-medium">Play Randomly</span>
      </Button>
    </div>
  );
}
