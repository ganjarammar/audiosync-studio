
# Setting Up Tauri Desktop App with One-Click Updates

This guide walks you through converting PodSync into a Windows desktop app with automatic updates via GitHub Actions.

---

## Step 1: Export and Clone Your Project

Since Tauri requires local development tools, you need to work on your computer:

1. **In Lovable**: Click the **GitHub** button in the top menu
2. Click **"Connect to GitHub"** (if not already connected)
3. Click **"Create Repository"** to push your code to GitHub
4. **On your computer**: Clone the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

---

## Step 2: Install Dependencies on Your Computer

### 2.1 Install Rust (if not already installed)
```bash
# Check if Rust is installed
rustc --version

# If not installed, run this in PowerShell:
winget install Rustlang.Rustup
# Or download from: https://rustup.rs
```

### 2.2 Install Visual Studio Build Tools
- Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Select **"Desktop development with C++"** workload

### 2.3 Install Node Dependencies
```bash
npm install

# Add Tauri CLI and API
npm install --save-dev @tauri-apps/cli@latest
npm install @tauri-apps/api@latest

# Add updater plugins
npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process @tauri-apps/plugin-dialog
```

---

## Step 3: Initialize Tauri

Run the Tauri init command:
```bash
npx tauri init
```

Answer the prompts:
| Prompt | Answer |
|--------|--------|
| App name | `PodSync` |
| Window title | `PodSync` |
| Frontend dev URL | `http://localhost:8080` |
| Frontend build command | `npm run build` |
| Frontend dist folder | `dist` |

This creates a `src-tauri` folder with configuration files.

---

## Step 4: Configure Tauri for Updates

### 4.1 Update `src-tauri/tauri.conf.json`

Replace the contents with:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "PodSync",
  "version": "1.0.0",
  "identifier": "app.podsync.desktop",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:8080",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "PodSync",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "updater": {
      "active": true,
      "dialog": false,
      "endpoints": [
        "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
      ],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 4.2 Update `src-tauri/Cargo.toml`

Add the updater plugins to the dependencies section:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### 4.3 Update `src-tauri/src/main.rs`

Replace with:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4.4 Create Capabilities File

Create `src-tauri/capabilities/main.json`:

```json
{
  "identifier": "main",
  "description": "Main capability for the app",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "updater:default",
    "process:allow-restart",
    "dialog:default"
  ]
}
```

---

## Step 5: Generate Signing Keys

Signing is required for the updater to work:

```bash
npx tauri signer generate -w ~/.tauri/podsync.key
```

This outputs:
- **Public key**: Copy this into `tauri.conf.json` under `plugins.updater.pubkey`
- **Private key**: Saved to `~/.tauri/podsync.key` (keep this secret!)

**Important**: Save the password you set - you'll need it for GitHub Actions.

---

## Step 6: Update Vite Configuration

Modify `vite.config.ts` for Tauri compatibility:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}));
```

---

## Step 7: Create the Update Button Component

Create `src/components/UpdateButton.tsx`:

```typescript
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

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function UpdateButton() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);

  // Check if running in Tauri
  const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

  if (!isTauri) {
    return null; // Don't show in browser
  }

  const checkForUpdates = async () => {
    try {
      setStatus("checking");
      
      const { check } = await import("@tauri-apps/plugin-updater");
      const { ask, message } = await import("@tauri-apps/plugin-dialog");
      const { relaunch } = await import("@tauri-apps/plugin-process");
      
      const update = await check();
      
      if (update?.available) {
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
      setStatus("error");
      toast.error("Failed to check for updates");
      
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
```

---

## Step 8: Add Update Button to Header

Modify `src/pages/Index.tsx` to include the UpdateButton in the header:

```typescript
// Add import at top
import { UpdateButton } from "@/components/UpdateButton";

// In the header, add before ColorPicker:
<UpdateButton />
<ColorPicker />
```

---

## Step 9: Create GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        platform: [windows-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "lts/*"
          cache: "npm"

      - name: Install Rust stable
        uses: dtolnay/rust-action@stable

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: "./src-tauri -> target"

      - name: Install dependencies
        run: npm ci

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: "PodSync v__VERSION__"
          releaseBody: "See the assets to download and install this version."
          releaseDraft: false
          prerelease: false
          includeUpdaterJson: true
```

---

## Step 10: Add GitHub Secrets

Go to your GitHub repository **Settings > Secrets and variables > Actions** and add:

| Secret Name | Value |
|-------------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/podsync.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The password you set when generating keys |

---

## Step 11: Update package.json Scripts

Add Tauri scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## Step 12: Test Locally

```bash
# Run in development mode
npm run tauri:dev

# Build for production (creates installer)
npm run tauri:build
```

---

## Step 13: Release a Version

When you're ready to release:

```bash
# Commit all changes
git add .
git commit -m "Add Tauri desktop app with auto-updater"
git push origin main

# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
1. Build the Windows installer
2. Generate `latest.json` for the updater
3. Attach all files to the GitHub Release

---

## How Users Get Updates

1. User opens PodSync desktop app
2. Clicks the refresh icon (Update button) in the header
3. If update available, a dialog asks to confirm
4. App downloads, installs, and restarts automatically

---

## File Changes Summary

| File | Action |
|------|--------|
| `package.json` | Modify - Add Tauri dependencies and scripts |
| `vite.config.ts` | Modify - Add Tauri compatibility settings |
| `src-tauri/tauri.conf.json` | Modify - Configure updater |
| `src-tauri/Cargo.toml` | Modify - Add plugin dependencies |
| `src-tauri/src/main.rs` | Modify - Register plugins |
| `src-tauri/capabilities/main.json` | Create - Permission configuration |
| `src/components/UpdateButton.tsx` | Create - Update button component |
| `src/pages/Index.tsx` | Modify - Add UpdateButton to header |
| `.github/workflows/release.yml` | Create - Automated build workflow |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `cargo not found` | Restart terminal after installing Rust |
| Build fails on Windows | Ensure Visual Studio Build Tools is installed |
| Update not detected | Check that `pubkey` matches your signing key |
| GitHub Action fails | Verify secrets are correctly set |
