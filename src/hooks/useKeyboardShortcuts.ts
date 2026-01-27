import { useEffect, useCallback } from "react";

interface ShortcutConfig {
  key: string;
  callback: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Cmd/Ctrl+F even in inputs for search
        if (e.key.toLowerCase() !== "f") return;
      }

      for (const shortcut of shortcuts) {
        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          shortcut.enabled !== false
        ) {
          e.preventDefault();
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Helper to get the modifier key label for the current platform
export function getModifierKey(): string {
  if (typeof navigator !== "undefined") {
    return navigator.platform.toUpperCase().includes("MAC") ? "⌘" : "Ctrl+";
  }
  return "Ctrl+";
}
