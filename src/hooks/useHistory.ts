import { useState, useCallback } from "react";
import {
  getAllProjects,
  getProject,
  getAudio,
  getScript,
  deleteProject,
  deleteAudio,
  deleteScript,
  saveProject,
} from "@/lib/db";
import { Project, AudioFile, Script } from "@/types/caption";

export interface LoadedProject {
  project: Project;
  audio: AudioFile;
  script: Script;
}

export function useHistory() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProjects = await getAllProjects();
      // Sort by most recent first
      allProjects.sort((a, b) => (b.lastPlayedAt || b.createdAt) - (a.lastPlayedAt || a.createdAt));
      setProjects(allProjects);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (projectId: string): Promise<LoadedProject | null> => {
    setIsLoading(true);
    try {
      const project = await getProject(projectId);
      if (!project) return null;

      const [audio, script] = await Promise.all([
        getAudio(project.audioId),
        getScript(project.scriptId),
      ]);

      if (!audio || !script) return null;

      // Update lastPlayedAt
      const updatedProject: Project = {
        ...project,
        lastPlayedAt: Date.now(),
      };
      await saveProject(updatedProject);

      return { project: updatedProject, audio, script };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const project = await getProject(projectId);
      if (!project) return;

      // Check if audio/script are used by other projects
      const allProjects = await getAllProjects();
      const otherProjects = allProjects.filter((p) => p.id !== projectId);

      const audioUsedElsewhere = otherProjects.some((p) => p.audioId === project.audioId);
      const scriptUsedElsewhere = otherProjects.some((p) => p.scriptId === project.scriptId);

      // Delete orphaned resources
      if (!audioUsedElsewhere) {
        await deleteAudio(project.audioId);
      }
      if (!scriptUsedElsewhere) {
        await deleteScript(project.scriptId);
      }

      await deleteProject(projectId);
      await refreshProjects();
    } finally {
      setIsLoading(false);
    }
  }, [refreshProjects]);

  return {
    projects,
    isLoading,
    refreshProjects,
    loadProject,
    removeProject,
  };
}
