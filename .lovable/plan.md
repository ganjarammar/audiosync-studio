

# PodLingo Rebranding Plan

## Overview
This plan covers updating all branding references from "PodSync" and generic "Lovable App" placeholders to **PodLingo** across the codebase.

## Files to Update

### 1. `index.html` - Web App Metadata
Update the HTML document with proper PodLingo branding:

| Element | Current Value | New Value |
|---------|--------------|-----------|
| `<title>` | Lovable App | PodLingo |
| `<meta name="description">` | Lovable Generated Project | PodLingo - Learn languages through podcast captions |
| `<meta name="author">` | Lovable | PodLingo |
| `<meta property="og:title">` | Lovable App | PodLingo |
| `<meta property="og:description">` | Lovable Generated Project | Learn languages through podcast captions with synchronized audio playback |
| Remove TODO comments | Yes | Clean up placeholder comments |

---

### 2. `src/pages/Index.tsx` - App Header
Update the visible app name in the header:

- **Line 96**: Change `PodSync` to `PodLingo`

---

### 3. `package.json` - NPM Package Name
Update the package name for consistency:

- **Line 2**: Change `"name": "vite_react_shadcn_ts"` to `"name": "podlingo"`

---

### 4. `README.md` - Project Documentation
Replace the generic Lovable README with PodLingo-specific documentation covering:

- Project description and features
- Desktop app build instructions (Tauri)
- Development setup
- Key features (caption sync, vocabulary tracking, auto-updater)

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `index.html` | Update | HTML title, meta tags, OG tags |
| `src/pages/Index.tsx` | Update | Header brand name (PodSync to PodLingo) |
| `package.json` | Update | Package name |
| `README.md` | Rewrite | Project-specific documentation |

---

## Technical Notes

- The `tauri.conf.json` already uses "PodLingo" for `productName`, window `title`, and `identifier` - no changes needed there
- The GitHub workflow already uses "PodLingo" in the release name - no changes needed
- The updater endpoint URL references "audiosync-studio" which is your GitHub repo name - this is fine to keep as-is since it's just the repo URL

