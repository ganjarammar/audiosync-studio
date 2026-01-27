import { useState, useCallback, useEffect } from "react";
import { saveAudio, saveScript, getAudio, getScript } from "@/lib/db";
import { parseScript } from "@/lib/captionParser";
import { Sentence, AudioFile, Script } from "@/types/caption";

export function useProject() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loadSavedProject = async () => {
      const savedAudioId = localStorage.getItem("currentAudioId");
      const savedScriptId = localStorage.getItem("currentScriptId");

      if (savedAudioId) {
        const audio = await getAudio(savedAudioId);
        if (audio) {
          const url = URL.createObjectURL(audio.blob);
          setAudioUrl(url);
          setAudioId(savedAudioId);
          setAudioFile(new File([audio.blob], audio.name, { type: audio.blob.type }));
        }
      }

      if (savedScriptId) {
        const script = await getScript(savedScriptId);
        if (script) {
          setSentences(script.sentences);
          setScriptId(savedScriptId);
          // Create a dummy file object for display
          const content = script.sentences.map(s => 
            `[${formatTime(s.startTime)} - ${formatTime(s.endTime)}] ${s.text}`
          ).join("\n");
          setScriptFile(new File([content], script.name, { type: "text/plain" }));
        }
      }
    };

    loadSavedProject();
  }, []);

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
      localStorage.setItem("currentAudioId", id);

      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFile(file);
      setAudioId(id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScriptUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const content = await file.text();
      const parsedSentences = parseScript(content);

      const id = crypto.randomUUID();
      const scriptData: Script = {
        id,
        name: file.name,
        sentences: parsedSentences,
        createdAt: Date.now(),
      };

      await saveScript(scriptData);
      localStorage.setItem("currentScriptId", id);

      setSentences(parsedSentences);
      setScriptFile(file);
      setScriptId(id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    audioFile,
    scriptFile,
    audioUrl,
    sentences,
    isLoading,
    handleAudioUpload,
    handleScriptUpload,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins.toString().padStart(2, "0")}:${secs.padStart(6, "0")}`;
}
