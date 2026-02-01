import { motion } from "framer-motion";
import { Headphones, Upload, FileText, Sparkles } from "lucide-react";

export function EmptyState() {
  // Animated bars for waveform visualization
  const bars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    height: 20 + Math.random() * 40,
    delay: i * 0.1,
  }));

  return (
    <div className="relative flex min-h-[320px] flex-col items-center justify-center rounded-2xl glass p-12 overflow-hidden">
      {/* Background animated gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15), transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated waveform decoration */}
      <div className="flex items-end gap-1 h-16 mb-6">
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="w-1.5 rounded-full bg-primary/30"
            initial={{ height: 8 }}
            animate={{
              height: [8, bar.height, 12, bar.height * 0.6, 8],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: bar.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main icon with pulse */}
      <motion.div
        className="relative mb-6"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center glow-box">
          <Headphones className="h-10 w-10 text-primary-foreground" />
        </div>
        
        {/* Floating sparkle accents */}
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ 
            y: [-2, 2, -2],
            rotate: [0, 15, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.h3
        className="text-xl font-semibold text-foreground mb-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Ready to learn?
      </motion.h3>
      
      <motion.p
        className="text-muted-foreground text-center mb-8 max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Upload your audio and script files to start practicing with synchronized captions
      </motion.p>

      {/* Interactive file hints */}
      <motion.div
        className="flex flex-wrap justify-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <FileHint
          icon={<Upload className="h-4 w-4" />}
          label="Audio"
          formats=".mp3, .wav"
          delay={0}
        />
        <FileHint
          icon={<FileText className="h-4 w-4" />}
          label="Script"
          formats=".txt, .srt"
          delay={0.1}
        />
      </motion.div>
    </div>
  );
}

function FileHint({
  icon,
  label,
  formats,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  formats: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-muted transition-colors cursor-default"
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + delay }}
    >
      <div className="text-primary">{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{formats}</span>
      </div>
    </motion.div>
  );
}
