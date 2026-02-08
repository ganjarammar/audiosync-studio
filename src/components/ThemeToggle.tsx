import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";

interface ThemeToggleProps {
  onToggle?: () => void;
}

export function ThemeToggle({ onToggle }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Always expose toggle for keyboard shortcut
  useEffect(() => {
    (window as any).__themeToggle = toggle;
    return () => {
      if ((window as any).__themeToggle === toggle) {
        delete (window as any).__themeToggle;
      }
    };
  }, [toggle]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/20 transition-colors"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{isDark ? "Light mode" : "Dark mode"} ({getModifierKey()}D)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Export a function to toggle theme externally
export function toggleTheme() {
  const toggle = (window as any).__themeToggle;
  if (toggle) toggle();
}
