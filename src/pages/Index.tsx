import { useState, useCallback } from "react";
import { Mic, FileText, Info } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CaptionDisplay } from "@/components/CaptionDisplay";
import { useProject } from "@/hooks/useProject";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const {
    audioFile,
    scriptFile,
    audioUrl,
    sentences,
    isLoading,
    handleAudioUpload,
    handleScriptUpload,
  } = useProject();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const isReady = audioUrl && sentences.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Mic className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PodSync</h1>
            <p className="text-sm text-muted-foreground">
              Animated podcast captions
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        {/* Upload Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Upload Files</h2>
          <FileUploader
            onAudioUpload={handleAudioUpload}
            onScriptUpload={handleScriptUpload}
            audioFile={audioFile}
            scriptFile={scriptFile}
            isLoading={isLoading}
          />
        </section>

        {/* Format Help */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Script Format</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">Your script file should have timestamps in this format:</p>
            <code className="block rounded bg-muted p-3 text-sm">
              [00:00:00.000 - 00:00:05.500] This is the first sentence.<br />
              [00:00:05.500 - 00:00:10.000] This is the second sentence.
            </code>
          </AlertDescription>
        </Alert>

        {/* Preview Section */}
        {isReady && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Preview</h2>

            {/* Caption Display */}
            <CaptionDisplay sentences={sentences} currentTime={currentTime} />

            {/* Audio Player */}
            <AudioPlayer
              audioUrl={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
            />
          </section>
        )}

        {/* Empty state when not ready */}
        {!isReady && (
          <div className="rounded-xl border-2 border-dashed bg-muted/30 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-muted-foreground">
              Upload both files to preview
            </h3>
            <p className="mt-2 text-sm text-muted-foreground/70">
              Add an audio file and a script with timestamps to see the animated captions
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
