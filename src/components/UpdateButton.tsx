import { useState, useEffect } from "react";
import { RefreshCw, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error" | "unavailable";

interface Update {
  version: string;
  rid: number;
}

// Create a minimal Channel that works with Tauri IPC
// The channel ID must be registered via transformCallback and passed as a number
function createChannel(callback: (message: any) => void): number {
  const internals = (window as any).__TAURI_INTERNALS__;

  // Tauri uses transformCallback to register callbacks and get an ID
  if (internals && typeof internals.transformCallback === "function") {
    return internals.transformCallback(callback);
  }

  // Fallback: register manually
  const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  const key = `_${id}`;
  (window as any)[key] = callback;
  return id;
}

export function UpdateButton() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [updaterAvailable, setUpdaterAvailable] = useState(false);

  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  useEffect(() => {
    if (!isTauri) return;

    const checkUpdaterAvailable = async () => {
      try {
        const internals = (window as any).__TAURI_INTERNALS__;
        if (internals && typeof internals.invoke === "function") {
          setUpdaterAvailable(true);
        }
      } catch {
        setUpdaterAvailable(false);
      }
    };

    checkUpdaterAvailable();
  }, [isTauri]);

  if (!isTauri || !updaterAvailable) {
    return null;
  }

  const checkForUpdates = async () => {
    try {
      setStatus("checking");
      console.log("[Updater] Starting update check...");

      const internals = (window as any).__TAURI_INTERNALS__;
      const update = await internals.invoke("plugin:updater|check") as Update;

      console.log("[Updater] check() returned:", update);

      if (update && update.version) {
        setStatus("available");

        const confirmed = await internals.invoke("plugin:dialog|ask", {
          message: `Version ${update.version} is available!\n\nWould you like to update now?`,
          title: "Update Available",
          okLabel: "Update Now",
          cancelLabel: "Later",
          kind: "info"
        });

        if (confirmed) {
          setStatus("downloading");
          console.log(`[Updater] Downloading update with rid: ${update.rid}`);

          // Create channel callback ID for progress events
          const onEvent = createChannel((event: any) => {
            console.log("[Updater] Progress event:", event);
            if (event?.event === "Started") {
              setProgress(0);
            } else if (event?.event === "Progress") {
              setProgress((prev) => Math.min(prev + 5, 95));
            } else if (event?.event === "Finished") {
              setProgress(100);
            }
          });

          await internals.invoke("plugin:updater|download_and_install", {
            rid: update.rid,
            onEvent: `__CHANNEL__:${onEvent}`
          });

          setStatus("ready");
          toast.success("Update installed! Restarting...");

          await internals.invoke("plugin:process|restart");
        } else {
          setStatus("idle");
        }
      } else {
        setStatus("idle");
        await internals.invoke("plugin:dialog|message", {
          message: "You're running the latest version!",
          title: "Up to Date",
          kind: "info"
        });
      }
    } catch (error) {
      console.error("Update check failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Update check failed: ${errorMessage}`);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getIcon = () => {
    switch (status) {
      case "checking":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "downloading":
        return <Download className="h-4 w-4 animate-pulse" />;
      case "ready":
        return <Check className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getTooltip = () => {
    switch (status) {
      case "checking":
        return "Checking for updates...";
      case "downloading":
        return `Downloading update... ${progress}%`;
      case "ready":
        return "Restarting...";
      default:
        return "Check for updates";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={checkForUpdates}
            disabled={status !== "idle" && status !== "error"}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/20 transition-colors"
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
