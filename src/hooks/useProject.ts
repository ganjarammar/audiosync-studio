import { useState, useCallback } from "react";
import { saveAudio, saveScript, saveProject as saveProjectToDB, getAudioByName, getProjectByName, getScriptByName } from "@/lib/db";
import { parseScript } from "@/lib/captionParser";
import { processScriptForVocabulary } from "@/lib/vocabularyProcessor";
import { Sentence, AudioFile, Script, Project } from "@/types/caption";
import { LoadedProject } from "./useHistory.ts";
import { toast } from "sonner";

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
  const [currentAudioName, setCurrentAudioName] = useState<string | null>(null);

  const handleAudioUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      // Check for duplicate audio
      const existingAudio = await getAudioByName(file.name);
      if (existingAudio) {
        toast.info("Audio already in playlist", {
          description: `"${file.name}" is already available in your playlist.`,
        });
        setIsLoading(false);
        return;
      }

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
      setCurrentAudioName(file.name);
      setIsProcessed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScriptUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      // Check for duplicate script
      const existingScript = await getScriptByName(file.name);
      if (existingScript) {
        toast.info("Script already uploaded", {
          description: `"${file.name}" is already available in your library.`,
        });
        setIsLoading(false);
        return;
      }

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

      // Check for duplicate project
      const existingProject = await getProjectByName(projectName);
      if (existingProject) {
        toast.info("Project already exists", {
          description: `A project with the name "${projectName}" is already in your playlist.`,
        });
        setIsLoading(false);
        return;
      }

      const project: Project = {
        id: projectId,
        name: projectName,
        audioId: audioId,
        audioName: audioFile.name,
        scriptId: id,
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      await saveProjectToDB(project);

      // Process vocabulary
      const vocabResult = await processScriptForVocabulary(scriptData);
      if (!vocabResult.skipped) {
        const totalWords = vocabResult.newWords + vocabResult.updatedWords;
        toast.success(`Added ${vocabResult.newWords} new words to your library!`, {
          description: `${vocabResult.updatedWords} existing words updated. Total: ${totalWords} unique words.`,
        });
      }

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
      setCurrentAudioName(loaded.audio.name);
      setIsProcessed(true);

      return {
        lastPosition: loaded.project.lastPosition,
        lastSentenceIndex: loaded.project.lastSentenceIndex,
      };
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
    currentAudioName,
  };
}
