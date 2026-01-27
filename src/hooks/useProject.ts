import { useState, useCallback } from "react";
import { saveAudio, saveScript, saveProject as saveProjectToDB } from "@/lib/db";
import { parseScript } from "@/lib/captionParser";
import { Sentence, AudioFile, Script, Project } from "@/types/caption";
import { LoadedProject } from "./useHistory.ts";

export function useProject() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [pendingScriptContent, setPendingScriptContent] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const handleAudioUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const id = crypto.randomUUID();
      const audioData: AudioFile = {
        id,
        name: file.name,
        blob: file,
        createdAt: Date.now(),
      };

      await saveAudio(audioData);

      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFile(file);
      setAudioId(id);
      setIsProcessed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScriptUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const content = await file.text();
      setPendingScriptContent(content);
      setScriptFile(file);
      setIsProcessed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processFiles = useCallback(async () => {
    if (!pendingScriptContent || !audioFile || !audioId) return;

    setIsLoading(true);
    try {
      const parsedSentences = parseScript(pendingScriptContent);

      const id = crypto.randomUUID();
      const scriptData: Script = {
        id,
        name: scriptFile?.name || "script.txt",
        sentences: parsedSentences,
        createdAt: Date.now(),
      };

      await saveScript(scriptData);

      // Create and save project
      const projectId = crypto.randomUUID();
      const projectName = audioFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const project: Project = {
        id: projectId,
        name: projectName,
        audioId: audioId,
        scriptId: id,
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      await saveProjectToDB(project);

      setSentences(parsedSentences);
      setScriptId(id);
      setCurrentProjectId(projectId);
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, [pendingScriptContent, audioFile, audioId, scriptFile?.name]);

  const loadProject = useCallback(async (loaded: LoadedProject) => {
    setIsLoading(true);
    try {
      // Create object URL from blob
      const url = URL.createObjectURL(loaded.audio.blob);
      
      setAudioUrl(url);
      setAudioFile(null); // No File object when loading from history
      setAudioId(loaded.audio.id);
      setSentences(loaded.script.sentences);
      setScriptId(loaded.script.id);
      setScriptFile(null);
      setPendingScriptContent(null);
      setCurrentProjectId(loaded.project.id);
      setIsProcessed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const canProcess = audioFile !== null && scriptFile !== null && !isProcessed;

  return {
    audioFile,
    scriptFile,
    audioUrl,
    sentences,
    isLoading,
    isProcessed,
    canProcess,
    currentProjectId,
    handleAudioUpload,
    handleScriptUpload,
    processFiles,
    loadProject,
  };
}
