import { useRef, useCallback, useEffect } from "react";
import { updateProjectPlaybackPosition } from "@/lib/db";
import { Sentence } from "@/types/caption";

interface UsePlaybackCheckpointOptions {
  projectId: string | null;
  sentences: Sentence[];
  currentTime: number;
  enabled?: boolean;
}

export function usePlaybackCheckpoint({
  projectId,
  sentences,
  currentTime,
  enabled = true,
}: UsePlaybackCheckpointOptions) {
  const lastSavedTimeRef = useRef<number>(0);
  const lastSavedSentenceRef = useRef<number>(-1);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find current sentence index based on time
  const getCurrentSentenceIndex = useCallback(
    (time: number): number => {
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (time >= sentence.startTime && time <= sentence.endTime) {
          return i;
        }
      }
      // If between sentences, find the nearest one
      for (let i = 0; i < sentences.length - 1; i++) {
        if (time > sentences[i].endTime && time < sentences[i + 1].startTime) {
          return i;
        }
      }
      return sentences.length > 0 ? sentences.length - 1 : -1;
    },
    [sentences]
  );

  // Debounced save function
  const saveCheckpoint = useCallback(
    (position: number, sentenceIndex: number) => {
      if (!projectId || !enabled) return;

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid too many writes
      saveTimeoutRef.current = setTimeout(() => {
        updateProjectPlaybackPosition(projectId, position, sentenceIndex).catch(
          console.error
        );
        lastSavedTimeRef.current = position;
        lastSavedSentenceRef.current = sentenceIndex;
      }, 2000); // Save every 2 seconds max
    },
    [projectId, enabled]
  );

  // Track playback position and save on sentence change
  useEffect(() => {
    if (!projectId || !enabled || sentences.length === 0) return;

    const currentSentenceIndex = getCurrentSentenceIndex(currentTime);
    
    // Save when sentence changes or every 3 seconds of playback
    const timeDiff = Math.abs(currentTime - lastSavedTimeRef.current);
    const sentenceChanged = currentSentenceIndex !== lastSavedSentenceRef.current;

    if (sentenceChanged || timeDiff >= 3) {
      saveCheckpoint(currentTime, currentSentenceIndex);
    }
  }, [currentTime, projectId, enabled, sentences, getCurrentSentenceIndex, saveCheckpoint]);

  // Save immediately on unmount or project change
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Force immediate save on cleanup
      if (projectId && enabled && sentences.length > 0) {
        const sentenceIndex = getCurrentSentenceIndex(lastSavedTimeRef.current);
        updateProjectPlaybackPosition(
          projectId,
          lastSavedTimeRef.current,
          sentenceIndex
        ).catch(console.error);
      }
    };
  }, [projectId, enabled, sentences, getCurrentSentenceIndex]);

  return {
    getCurrentSentenceIndex,
  };
}
