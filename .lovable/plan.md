
# History Feature Implementation Plan

## Overview
Add a persistent history sidebar that saves all uploaded audio and caption pairs as "projects" that users can browse, replay, and manage. This transforms PodSync into a desktop-ready app where your work is always saved.

## What You'll Get
- **History Sidebar**: A slide-out panel showing all your past projects with timestamps
- **Instant Replay**: Click any project to immediately load and play it
- **Project Management**: Delete old projects you no longer need
- **Auto-Save**: Every time you process audio + captions, it automatically saves to history
- **Persistent Storage**: Uses your browser's built-in database, so data survives page refreshes

## User Experience Flow
1. Upload audio and script files as usual
2. Click "Generate Preview" - project automatically saves to history
3. Click the History icon in the header to see all past projects
4. Click any project to load it instantly
5. Delete projects with the trash icon

---

## Technical Implementation

### 1. New Component: History Sidebar
**File**: `src/components/HistorySidebar.tsx`

Creates a Sheet component (slide-out panel) that:
- Fetches all projects from IndexedDB on open
- Displays projects sorted by date (newest first)
- Shows project name, audio file name, and relative timestamp (e.g., "2 hours ago")
- Provides load and delete actions for each project
- Uses existing glass/glow styling for visual consistency

### 2. New Hook: useHistory
**File**: `src/hooks/useHistory.tsx`

A custom hook that manages:
- Loading all projects from IndexedDB
- Loading a specific project (fetches linked audio + script data)
- Deleting projects (cascades to delete orphaned audio/scripts)
- Refreshing the project list after changes

### 3. Update: useProject Hook
**File**: `src/hooks/useProject.ts`

Modifications:
- Remove the localStorage clearing on mount (allow persistence)
- Add `saveProject()` call when processing files to create a Project record
- Add `loadProject(projectId)` function to restore a saved project
- Return the `loadProject` function for the UI to use

### 4. Update: Types
**File**: `src/types/caption.ts`

Add optional `lastPlayedAt` field to Project interface for tracking recent plays.

### 5. Update: Index Page
**File**: `src/pages/Index.tsx`

- Add History button to header (next to theme toggles)
- Import and render HistorySidebar component
- Connect loadProject callback to restore saved sessions

### 6. Update: Database
**File**: `src/lib/db.ts`

Add `getProject(id)` function to fetch a single project by ID.

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/HistorySidebar.tsx` | Create | History panel UI |
| `src/hooks/useHistory.tsx` | Create | History data management |
| `src/hooks/useProject.ts` | Modify | Add project saving/loading |
| `src/types/caption.ts` | Modify | Add lastPlayedAt field |
| `src/pages/Index.tsx` | Modify | Add history button + sidebar |
| `src/lib/db.ts` | Modify | Add getProject function |
