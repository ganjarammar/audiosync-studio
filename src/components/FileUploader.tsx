import { useCallback, useState } from "react";
import { Music, FileText, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuminousBorder } from "./LuminousBorder";

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
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Audio Upload Button */}
      <LuminousBorder active={!audioFile}>
        <label
          className={cn(
            "group relative cursor-pointer",
            "flex items-center gap-2 rounded-full px-5 py-2.5",
            "glass transition-all duration-200",
            "hover:bg-accent/20 hover:border-primary/30",
            audioDragActive && "border-primary bg-accent/30",
            audioFile && "border-primary/50 bg-accent/20"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setAudioDragActive(true);
          }}
          onDragLeave={() => setAudioDragActive(false)}
          onDrop={handleAudioDrop}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="sr-only"
            disabled={isLoading}
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : audioFile ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Music className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
          )}
          <span className={cn(
            "text-sm transition-colors",
            audioFile ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {audioFile ? (
              <span className="max-w-[150px] truncate inline-block align-middle">
                {audioFile.name}
              </span>
            ) : (
              "Audio"
            )}
          </span>
        </label>
      </LuminousBorder>

      {/* Script Upload Button */}
      <LuminousBorder active={!scriptFile}>
        <label
          className={cn(
            "group relative cursor-pointer",
            "flex items-center gap-2 rounded-full px-5 py-2.5",
            "glass transition-all duration-200",
            "hover:bg-accent/20 hover:border-primary/30",
            scriptDragActive && "border-primary bg-accent/30",
            scriptFile && "border-primary/50 bg-accent/20"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setScriptDragActive(true);
          }}
          onDragLeave={() => setScriptDragActive(false)}
          onDrop={handleScriptDrop}
        >
          <input
            type="file"
            accept=".txt,.srt,.vtt"
            onChange={handleScriptChange}
            className="sr-only"
            disabled={isLoading}
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : scriptFile ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <FileText className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
          )}
          <span className={cn(
            "text-sm transition-colors",
            scriptFile ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {scriptFile ? (
              <span className="max-w-[150px] truncate inline-block align-middle">
                {scriptFile.name}
              </span>
            ) : (
              "Script"
            )}
          </span>
        </label>
      </LuminousBorder>
    </div>
  );
}
