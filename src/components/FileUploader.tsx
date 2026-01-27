import { useCallback, useState } from "react";
import { Upload, Music, FileText, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onAudioUpload: (file: File) => Promise<void>;
  onScriptUpload: (file: File) => Promise<void>;
  audioFile: File | null;
  scriptFile: File | null;
  isLoading: boolean;
}

export function FileUploader({
  onAudioUpload,
  onScriptUpload,
  audioFile,
  scriptFile,
  isLoading,
}: FileUploaderProps) {
  const [audioDragActive, setAudioDragActive] = useState(false);
  const [scriptDragActive, setScriptDragActive] = useState(false);

  const handleAudioDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setAudioDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        await onAudioUpload(file);
      }
    },
    [onAudioUpload]
  );

  const handleScriptDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setScriptDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        await onScriptUpload(file);
      }
    },
    [onScriptUpload]
  );

  const handleAudioChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onAudioUpload(file);
      }
    },
    [onAudioUpload]
  );

  const handleScriptChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onScriptUpload(file);
      }
    },
    [onScriptUpload]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          audioDragActive && "ring-2 ring-primary ring-offset-2",
          audioFile && "border-emerald-500/50 bg-emerald-500/5"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setAudioDragActive(true);
        }}
        onDragLeave={() => setAudioDragActive(false)}
        onDrop={handleAudioDrop}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio File
          </CardTitle>
          <CardDescription>
            Upload your podcast audio file (MP3, WAV, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              audioDragActive && "border-primary bg-primary/10"
            )}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="sr-only"
              disabled={isLoading}
            />
            {isLoading ? (
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            ) : audioFile ? (
              <>
                <Check className="h-10 w-10 text-emerald-500" />
                <p className="mt-2 text-sm font-medium">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop or click to upload
                </p>
              </>
            )}
          </label>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          scriptDragActive && "ring-2 ring-primary ring-offset-2",
          scriptFile && "border-emerald-500/50 bg-emerald-500/5"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setScriptDragActive(true);
        }}
        onDragLeave={() => setScriptDragActive(false)}
        onDrop={handleScriptDrop}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Script File
          </CardTitle>
          <CardDescription>
            Upload your caption script with timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              scriptDragActive && "border-primary bg-primary/10"
            )}
          >
            <input
              type="file"
              accept=".txt,.srt,.vtt"
              onChange={handleScriptChange}
              className="sr-only"
              disabled={isLoading}
            />
            {isLoading ? (
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            ) : scriptFile ? (
              <>
                <Check className="h-10 w-10 text-emerald-500" />
                <p className="mt-2 text-sm font-medium">{scriptFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop or click to upload
                </p>
              </>
            )}
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
