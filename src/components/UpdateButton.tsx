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
  rid: number; // Resource ID required for download_and_install
  available: boolean;
}

export function UpdateButton() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [updaterAvailable, setUpdaterAvailable] = useState(false);

  // Check if running in Tauri v2
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  // Check if updater module is available on mount
  useEffect(() => {
    if (!isTauri) return;

    // Try to load the updater module to see if it's available
    const checkUpdaterAvailable = async () => {
      try {
        // Use window.__TAURI_INTERNALS__ to check if updater is registered
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

      // Use Tauri's invoke directly to call the updater
      const internals = (window as any).__TAURI_INTERNALS__;

      // Check for updates using the plugin command
      const update = await internals.invoke("plugin:updater|check") as Update;

      console.log("[Updater] check() returned:", update);

      // In the raw plugin response, we might check for existence of properties
      if (update && update.version) {
        setStatus("available");

        // Use dialog plugin
        const confirmed = await internals.invoke("plugin:dialog|ask", {
          message: `Version ${update.version} is available!\n\nWould you like to update now?`,
          title: "Update Available",
          okLabel: "Update Now",
          cancelLabel: "Later",
          kind: "info"
        });

        if (confirmed) {
          setStatus("downloading");

          // Download and install
          // We must pass the 'rid' that we got from the check command
          console.log(`[Updater] Downloading update with rid: ${update.rid}`);
          await internals.invoke("plugin:updater|download_and_install", {
            rid: update.rid
          });

          setStatus("ready");
          toast.success("Update installed! Restarting...");

          // Relaunch using process plugin
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
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
