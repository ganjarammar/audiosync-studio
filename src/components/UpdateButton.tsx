import { useState } from "react";
import { RefreshCw, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function UpdateButton() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);

  // Check if running in Tauri v2 (uses __TAURI_INTERNALS__ instead of __TAURI__)
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (!isTauri) {
    return null; // Don't show in browser
  }

  const checkForUpdates = async () => {
    try {
      setStatus("checking");

      console.log("[Updater] Starting update check...");
      console.log("[Updater] Calling check()...");

      // Add timeout to prevent infinite spinning
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Update check timed out after 30 seconds")), 30000);
      });

      const update = await Promise.race([check(), timeoutPromise]);

      console.log("[Updater] check() returned:", update);

      if (update) {
        setStatus("available");

        const confirmed = await ask(
          `Version ${update.version} is available!\n\nWould you like to update now?`,
          {
            title: "Update Available",
            okLabel: "Update Now",
            cancelLabel: "Later",
            kind: "info"
          }
        );

        if (confirmed) {
          setStatus("downloading");

          await update.downloadAndInstall((event) => {
            if (event.event === "Started" && event.data.contentLength) {
              setProgress(0);
            } else if (event.event === "Progress") {
              const percent = Math.round((event.data.chunkLength / (event.data.contentLength || 1)) * 100);
              setProgress(percent);
            } else if (event.event === "Finished") {
              setProgress(100);
            }
          });

          setStatus("ready");
          toast.success("Update installed! Restarting...");

          await relaunch();
        } else {
          setStatus("idle");
        }
      } else {
        setStatus("idle");
        await message("You're running the latest version!", {
          title: "Up to Date",
          kind: "info"
        });
      }
    } catch (error) {
      console.error("Update check failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to check for updates: ${errorMessage}`);
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
