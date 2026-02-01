import { useState, useCallback, useEffect, useMemo } from "react";
import { Headphones, Play, HelpCircle } from "lucide-react"; // header icon
import { FileUploader } from "@/components/FileUploader";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CaptionDisplay } from "@/components/CaptionDisplay";
import { ColorPicker } from "@/components/ColorPicker";
import { ThemeToggle, toggleTheme } from "@/components/ThemeToggle";
import { HistorySidebar } from "@/components/HistorySidebar";
import { VocabularyLibrary } from "@/components/VocabularyLibrary";
import { ScriptSearch } from "@/components/ScriptSearch";
import { UpdateButton } from "@/components/UpdateButton";
import { QuickActionsBar, QuickLoadedProject } from "@/components/QuickActionsBar";
import { EmptyState } from "@/components/EmptyState";
import { useProject } from "@/hooks/useProject";
import { usePlaybackCheckpoint } from "@/hooks/usePlaybackCheckpoint";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Index = () => {
  const {
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
  } = useProject();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  const isReady = audioUrl && sentences.length > 0 && isProcessed;

  // Auto-checkpoint for playback position
  usePlaybackCheckpoint({
    projectId: currentProjectId,
    sentences,
    currentTime,
    enabled: isReady,
  });

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => [
      { key: "h", callback: () => setHistoryOpen((prev) => !prev) },
      { key: "b", callback: () => setVocabOpen((prev) => !prev) },
      { key: "f", callback: () => setSearchOpen((prev) => !prev), enabled: isReady },
      { key: "d", callback: toggleTheme },
    ],
    [isReady]
  );
  useKeyboardShortcuts(shortcuts);

  const handleSeekTo = useCallback((time: number) => {
    setSeekToTime(time);
  }, []);

  const handleSeekComplete = useCallback(() => {
    setSeekToTime(null);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
  }, []);


  // Handle quick load from QuickActionsMenu
  const handleQuickLoad = useCallback((loaded: QuickLoadedProject) => {
    loadProject({
      project: loaded.project,
      audio: loaded.audio,
      script: loaded.script,
    });
    setShouldAutoPlay(true);
    if (loaded.seekToPosition !== undefined) {
      setSeekToTime(loaded.seekToPosition);
    }
  }, [loadProject]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-box">
              <Headphones className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PodLingo</span>
          </div>
          
          <div className="flex items-center gap-1">
            <HistorySidebar
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              onLoadProject={(loaded, autoPlay) => {
                const result = loadProject(loaded);
                setShouldAutoPlay(autoPlay ?? false);
                // If loading from history with autoPlay and there's a saved position, seek to it
                if (autoPlay && loaded.project.lastPosition !== undefined) {
                  setSeekToTime(loaded.project.lastPosition);
                }
              }}
            />
            <VocabularyLibrary open={vocabOpen} onOpenChange={setVocabOpen} />
            {isReady && (
              <ScriptSearch
                sentences={sentences}
                onSeekTo={handleSeekTo}
                currentTime={currentTime}
                open={searchOpen}
                onOpenChange={setSearchOpen}
              />
            )}
            <UpdateButton />
            <ColorPicker />
            <ThemeToggle />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm font-medium mb-2">Script Format</p>
                  <code className="block text-xs opacity-80">
                    [00:00:00.000 - 00:00:05.500] First sentence.<br />
                    [00:00:05.500 - 00:00:10.000] Second sentence.
                  </code>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Quick Actions Bar - Above Main Content */}
          <QuickActionsBar onQuickLoad={handleQuickLoad} refreshTrigger={currentProjectId} />

          {/* Caption Display - Hero Element */}
          {isReady ? (
            <div className="space-y-6">
              <CaptionDisplay sentences={sentences} currentTime={currentTime} />
              <AudioPlayer
                audioUrl={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                autoPlay={shouldAutoPlay}
                onAutoPlayTriggered={() => setShouldAutoPlay(false)}
                seekTo={seekToTime}
                onSeekComplete={handleSeekComplete}
              />
            </div>
          ) : (
            <EmptyState />
          )}

          {/* Process Button */}
          {canProcess && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={processFiles}
                disabled={isLoading}
                className="gap-2 gradient-primary text-primary-foreground animate-pulse-glow px-8 py-6 text-base font-medium rounded-full"
              >
                <Play className="h-5 w-5" />
                Generate Preview
              </Button>
            </div>
          )}

          {/* Compact File Uploader */}
          <FileUploader
            onAudioUpload={handleAudioUpload}
            onScriptUpload={handleScriptUpload}
            audioFile={audioFile}
            scriptFile={scriptFile}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
