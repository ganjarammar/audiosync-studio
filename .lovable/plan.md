

# Quick Actions Menu & Auto-Checkpoint Implementation Plan

## Overview
This plan adds three main features:
1. **Quick Actions Menu** in the header with: Continue Listening, Recently Added, Play Randomly
2. **Favorites System** integrated into the History sidebar
3. **Auto-Checkpoint** that saves/restores playback position at the sentence level for all projects

---

## Part 1: Database Schema Updates

### Extend Project Type
Add new fields to track playback position and favorites:

```typescript
// src/types/caption.ts
export interface Project {
  id: string;
  name: string;
  audioId: string;
  scriptId: string;
  createdAt: number;
  lastPlayedAt?: number;
  // NEW FIELDS:
  isFavorite?: boolean;           // For favorites feature
  lastPosition?: number;          // Playback position in seconds
  lastSentenceIndex?: number;     // Current sentence index for checkpoint
}
```

### Add DB Functions
New functions in `src/lib/db.ts`:
- `updateProjectPlaybackPosition(projectId, position, sentenceIndex)` - Save checkpoint
- `getRecentlyAddedProjects(limit)` - Get newest projects by `createdAt`
- `toggleProjectFavorite(projectId)` - Toggle favorite status

---

## Part 2: Quick Actions Menu Component

### New Component: `src/components/QuickActionsMenu.tsx`

A dropdown menu in the header with three actions:

| Action | Icon | Behavior |
|--------|------|----------|
| Continue Listening | `PlayCircle` | Load last played project and seek to saved position |
| Recently Added | `Sparkles` | Load the most recently added project |
| Play Randomly | `Shuffle` | Pick a random project from history |

The menu will:
- Be disabled/hidden when no projects exist
- Show the project name as a hint for "Continue Listening"
- Trigger auto-play after loading

---

## Part 3: Auto-Checkpoint System

### Save Position on Playback
In `src/pages/Index.tsx`:
- Track the current sentence index from `CaptionDisplay`
- Debounce position saves (every 2-3 seconds or on sentence change)
- Save `{ position, sentenceIndex }` to the current project

### Restore Position on Load
In `src/hooks/useProject.ts`:
- When loading a project, expose `lastPosition` and `lastSentenceIndex`
- Pass the saved position to `AudioPlayer` for auto-seek

### Position Flow
```text
User plays audio
    ↓
currentTime updates → detect sentence changes
    ↓
Save position to IndexedDB (debounced)
    ↓
User closes app / switches project
    ↓
Reopens or clicks "Continue Listening"
    ↓
Load project with saved position → seek to that time
```

---

## Part 4: Favorites in History Sidebar

### UI Changes to `src/components/HistorySidebar.tsx`

1. **Add Favorites Tab/Filter**
   - Toggle button or tabs: "All" | "Favorites"
   - Filter projects by `isFavorite` flag

2. **Star Button on Each Project Card**
   - Appears alongside Play/Delete buttons on hover
   - Filled star for favorites, outline for non-favorites
   - Click to toggle favorite status

3. **Sorting Enhancement**
   - Add sort option: "Favorites first"

---

## Part 5: Header Integration

### Update `src/pages/Index.tsx`
Add the `QuickActionsMenu` component to the header toolbar, positioned near History/Vocabulary buttons.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/caption.ts` | Modify | Add `isFavorite`, `lastPosition`, `lastSentenceIndex` to Project |
| `src/lib/db.ts` | Modify | Add position/favorite update functions |
| `src/components/QuickActionsMenu.tsx` | Create | New quick actions dropdown component |
| `src/hooks/useProject.ts` | Modify | Handle loading saved position, add position save hook |
| `src/hooks/useHistory.ts` | Modify | Add random project, recently added helpers |
| `src/pages/Index.tsx` | Modify | Integrate QuickActionsMenu, add position tracking |
| `src/components/HistorySidebar.tsx` | Modify | Add favorites toggle, star button, favorites filter |
| `src/components/AudioPlayer.tsx` | Modify | Accept initial position for seeking on load |

---

## Technical Notes

- **Debouncing**: Position saves will be debounced to avoid excessive IndexedDB writes during playback
- **Sentence Detection**: Will track sentence index changes by comparing `currentTime` against sentence boundaries
- **IndexedDB Compatibility**: No schema version bump needed since we're adding optional fields to existing records
- **Empty State Handling**: Quick Actions menu will gracefully handle no projects (disabled state or hidden)
- **Keyboard Shortcuts**: Can optionally add shortcuts like `Cmd+Shift+P` for Continue Listening

