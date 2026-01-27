import { useState, useCallback } from "react";
import { Mic, Play, HelpCircle } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CaptionDisplay } from "@/components/CaptionDisplay";
import { useProject } from "@/hooks/useProject";
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
    handleAudioUpload,
    handleScriptUpload,
    processFiles,
  } = useProject();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const isReady = audioUrl && sentences.length > 0 && isProcessed;

  return (
    <div className="dark min-h-screen gradient-dark">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-box">
              <Mic className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PodSync</span>
          </div>
          
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
      </header>

      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Caption Display - Hero Element */}
          {isReady ? (
            <div className="space-y-6">
              <CaptionDisplay sentences={sentences} currentTime={currentTime} />
              <AudioPlayer
                audioUrl={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
              />
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl glass p-12">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Mic className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg text-muted-foreground text-center">
                Upload files to preview captions
              </p>
            </div>
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
