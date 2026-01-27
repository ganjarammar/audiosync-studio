
# Fix: Auto-Play Audio When Loading from History Play Button

## The Problem
When you click the Play button on a project in the history sidebar, it loads the project but doesn't start playing the audio. The Play button currently does the same thing as clicking anywhere on the project card - it just loads the project.

## The Solution
Add an "auto-play" feature that starts audio playback automatically when you click the Play button (but not when you just click to load).

## How It Will Work
1. Click the **Play button** → Project loads AND audio starts playing immediately
2. Click **anywhere else on the card** → Project loads but audio stays paused (current behavior)

---

## Technical Changes

### 1. Update AudioPlayer Component
**File**: `src/components/AudioPlayer.tsx`

Add an optional `autoPlay` prop that triggers playback when set to true:
- New prop: `autoPlay?: boolean`
- Add a `useEffect` that watches for `autoPlay` and the audio source changes
- When both conditions are met, call `audio.play()` automatically

### 2. Update Index Page
**File**: `src/pages/Index.tsx`

Track whether the loaded project should auto-play:
- New state: `shouldAutoPlay` (boolean)
- Pass `autoPlay={shouldAutoPlay}` to `AudioPlayer`
- Reset `shouldAutoPlay` to false after playback starts
- Update `onLoadProject` callback to accept an optional `autoPlay` parameter

### 3. Update useProject Hook
**File**: `src/hooks/useProject.ts`

Modify `loadProject` to accept and return an auto-play flag:
- Add optional `autoPlay` parameter to `loadProject` function
- Return this flag so the Index page knows whether to trigger auto-play

### 4. Update HistorySidebar Component
**File**: `src/components/HistorySidebar.tsx`

Differentiate between "load" and "load & play" actions:
- Modify `handleLoad` to accept an optional `shouldPlay` parameter
- When Play button is clicked, pass `shouldPlay: true`
- When card is clicked, pass `shouldPlay: false` (or omit)

### 5. Update HistorySidebar Props
**File**: `src/components/HistorySidebar.tsx`

Update the `onLoadProject` callback type to include an auto-play flag:
- Change from `onLoadProject: (loaded: LoadedProject) => void`
- Change to `onLoadProject: (loaded: LoadedProject, autoPlay?: boolean) => void`

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/AudioPlayer.tsx` | Add `autoPlay` prop with effect to trigger playback |
| `src/pages/Index.tsx` | Add `shouldAutoPlay` state, pass to AudioPlayer |
| `src/components/HistorySidebar.tsx` | Pass `autoPlay` flag when Play button clicked |

## User Experience After Fix
- Click project card → Project loads, ready to play manually
- Click Play button → Project loads AND starts playing immediately
