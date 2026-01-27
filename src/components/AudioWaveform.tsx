import { useRef, useEffect, useCallback } from "react";

interface AudioWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export function AudioWaveform({ audioRef, isPlaying }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const setupAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
    }
  }, [audioRef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barCount = Math.min(bufferLength, 48);
    const barWidth = width / barCount;
    const gap = 2;

    // Get the primary color from CSS variables
    const style = getComputedStyle(document.documentElement);
    const primaryHsl = style.getPropertyValue("--primary").trim();

    for (let i = 0; i < barCount; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.8;
      const x = i * barWidth + gap / 2;
      const y = height - barHeight;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, y);
      gradient.addColorStop(0, `hsla(${primaryHsl}, 0.1)`);
      gradient.addColorStop(0.5, `hsla(${primaryHsl}, 0.3)`);
      gradient.addColorStop(1, `hsla(${primaryHsl}, 0.5)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - gap, barHeight, 2);
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barCount = 48;
    const barWidth = width / barCount;
    const gap = 2;

    const style = getComputedStyle(document.documentElement);
    const primaryHsl = style.getPropertyValue("--primary").trim();

    for (let i = 0; i < barCount; i++) {
      // Create a subtle wave pattern for idle state
      const barHeight = height * 0.05 + Math.sin(Date.now() / 1000 + i * 0.3) * height * 0.02;
      const x = i * barWidth + gap / 2;
      const y = height - barHeight;

      ctx.fillStyle = `hsla(${primaryHsl}, 0.15)`;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - gap, barHeight, 2);
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(drawIdle);
  }, []);

  // Setup audio context on first play
  useEffect(() => {
    if (isPlaying && !audioContextRef.current) {
      setupAudioContext();
    }
  }, [isPlaying, setupAudioContext]);

  // Resume audio context if suspended (browser autoplay policy)
  useEffect(() => {
    const audioContext = audioContextRef.current;
    if (isPlaying && audioContext?.state === "suspended") {
      audioContext.resume();
    }
  }, [isPlaying]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      draw();
    } else {
      drawIdle();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw, drawIdle]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
