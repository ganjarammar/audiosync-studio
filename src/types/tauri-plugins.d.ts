// Type declarations for Tauri plugins
// These are installed locally when building the desktop app

declare module "@tauri-apps/plugin-updater" {
  export interface Update {
    available: boolean;
    version?: string;
    downloadAndInstall: (
      onProgress?: (event: {
        event: "Started" | "Progress" | "Finished";
        data: {
          contentLength?: number;
          chunkLength?: number;
        };
      }) => void
    ) => Promise<void>;
  }

  export function check(): Promise<Update | null>;
}

declare module "@tauri-apps/plugin-dialog" {
  export interface AskOptions {
    title?: string;
    okLabel?: string;
    cancelLabel?: string;
    kind?: "info" | "warning" | "error";
  }

  export interface MessageOptions {
    title?: string;
    kind?: "info" | "warning" | "error";
  }

  export function ask(message: string, options?: AskOptions): Promise<boolean>;
  export function message(message: string, options?: MessageOptions): Promise<void>;
}

declare module "@tauri-apps/plugin-process" {
  export function relaunch(): Promise<void>;
}
