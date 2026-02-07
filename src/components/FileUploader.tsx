import { useCallback, useState } from "react";
import { Music, FileText, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";


interface FileUploaderProps {
  onAudioUpload: (file: File) => Promise<void>;
  onScriptUpload: (file: File) => Promise<void>;
  audioFile: File | null;
  scriptFile: File | null;
  isLoading: boolean;
  hasActiveAudio?: boolean;
  hasActiveScript?: boolean;
}

export function FileUploader({
  onAudioUpload,
  onScriptUpload,
  audioFile,
  scriptFile,
  isLoading,
  hasActiveAudio = false,
  hasActiveScript = false,
}: FileUploaderProps) {
  const [audioDragActive, setAudioDragActive] = useState(false);
  const [scriptDragActive, setScriptDragActive] = useState(false);
  const [audioHovered, setAudioHovered] = useState(false);
  const [scriptHovered, setScriptHovered] = useState(false);

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
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Audio Upload Button */}
      <label
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-6 py-4 transition-all duration-300",
          "hover:-translate-y-0.5 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]",
          audioDragActive
            ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]"
            : "border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-primary/5",
          // Show active state if file is uploaded manually OR if we have active audio from other source
          (audioFile || hasActiveAudio)
            ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.15)]"
            : !audioDragActive && "animate-pulse-glow border-primary/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setAudioDragActive(true);
        }}
        onDragLeave={() => setAudioDragActive(false)}
        onDrop={handleAudioDrop}
        onMouseEnter={() => setAudioHovered(true)}
        onMouseLeave={() => setAudioHovered(false)}
      >
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
          (audioFile || hasActiveAudio) ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
        )}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (audioFile || hasActiveAudio) && !audioHovered ? (
            <Check className="h-5 w-5" />
          ) : (
            <Music className="h-5 w-5" />
          )}
        </div>

        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioChange}
          className="sr-only"
          disabled={isLoading}
        />

        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-medium transition-colors",
            (audioFile || hasActiveAudio) ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {audioFile ? "Audio Loaded" : (hasActiveAudio && !audioHovered) ? "Audio Playing" : "Upload Audio"}
          </span>
          {audioFile && (
            <span className="max-w-[120px] truncate text-xs text-muted-foreground">
              {audioFile.name}
            </span>
          )}
        </div>
      </label>

      {/* Script Upload Button */}
      <label
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-6 py-4 transition-all duration-300",
          "hover:-translate-y-0.5 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]",
          scriptDragActive
            ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]"
            : "border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-primary/5",
          (scriptFile || hasActiveScript)
            ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.15)]"
            : !scriptDragActive && "animate-pulse-glow border-primary/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setScriptDragActive(true);
        }}
        onDragLeave={() => setScriptDragActive(false)}
        onDrop={handleScriptDrop}
        onMouseEnter={() => setScriptHovered(true)}
        onMouseLeave={() => setScriptHovered(false)}
      >
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
          (scriptFile || hasActiveScript) ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
        )}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (scriptFile || hasActiveScript) && !scriptHovered ? (
            <Check className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>

        <input
          type="file"
          accept=".txt,.srt,.vtt"
          onChange={handleScriptChange}
          className="sr-only"
          disabled={isLoading}
        />

        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-medium transition-colors",
            (scriptFile || hasActiveScript) ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {scriptFile ? "Script Loaded" : (hasActiveScript && !scriptHovered) ? "Script Ready" : "Upload Script"}
          </span>
          {scriptFile && (
            <span className="max-w-[120px] truncate text-xs text-muted-foreground">
              {scriptFile.name}
            </span>
          )}
        </div>
      </label >
    </div >
  );
}
