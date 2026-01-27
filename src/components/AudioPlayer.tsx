import { useRef, useEffect, useCallback, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTimestamp } from "@/lib/captionParser";
import { cn } from "@/lib/utils";
import { AudioWaveform } from "./AudioWaveform";

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  autoPlay?: boolean;
  onAutoPlayTriggered?: () => void;
  seekTo?: number | null;
  onSeekComplete?: () => void;
}

export function AudioPlayer({
  audioUrl,
  onTimeUpdate,
  onDurationChange,
  autoPlay,
  onAutoPlayTriggered,
  seekTo,
  onSeekComplete,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate(time);
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      setDuration(dur);
      onDurationChange(dur);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate, onDurationChange]);

  // Auto-play effect when loading from history with play button
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoPlay) return;

    const handleCanPlay = () => {
      audio.play().then(() => {
        onAutoPlayTriggered?.();
      }).catch(() => {
        // Auto-play was blocked by browser
        onAutoPlayTriggered?.();
      });
    };

    if (audio.readyState >= 3) {
      // Audio is already ready
      handleCanPlay();
    } else {
      audio.addEventListener("canplay", handleCanPlay, { once: true });
      return () => audio.removeEventListener("canplay", handleCanPlay);
    }
  }, [audioUrl, autoPlay, onAutoPlayTriggered]);

  // External seek control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTo === null || seekTo === undefined) return;
    
    audio.currentTime = seekTo;
    setCurrentTime(seekTo);
    onTimeUpdate(seekTo);
    
    // Auto-play after seeking
    if (audio.paused) {
      audio.play().catch(() => {});
    }
    
    onSeekComplete?.();
  }, [seekTo, onTimeUpdate, onSeekComplete]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
    onTimeUpdate(value[0]);
  }, [onTimeUpdate]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  }, [duration]);

  return (
    <div 
      className="glass rounded-2xl p-4 transition-all duration-300 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Waveform visualizer background */}
      <AudioWaveform audioRef={audioRef} isPlaying={isPlaying} />
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Progress bar */}
      <div className="mb-4 relative z-10">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatTimestamp(currentTime)}</span>
          <span>{formatTimestamp(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 relative z-10">
        {/* Skip back - show on hover */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(-10)}
          className={cn(
            "h-9 w-9 rounded-full transition-all duration-200",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Main play button */}
        <Button
          onClick={togglePlay}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full transition-all duration-200",
            "gradient-primary glow-box hover:scale-105"
          )}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-primary-foreground" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5 text-primary-foreground" />
          )}
        </Button>

        {/* Skip forward - show on hover */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(10)}
          className={cn(
            "h-9 w-9 rounded-full transition-all duration-200",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Mute toggle - show on hover */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className={cn(
            "h-9 w-9 rounded-full transition-all duration-200 ml-4",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
