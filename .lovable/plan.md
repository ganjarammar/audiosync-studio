

# Add Running Light Animation to Upload Buttons

## Goal
Add an eye-catching shimmer/sweep animation to the Audio and Script upload buttons when the app first opens. This serves as a visual onboarding cue to guide new users on the first action they need to take.

## How It Will Work

The animation will:
- Play automatically when the app opens (fresh page load)
- Run for a limited time (e.g., 3-5 loops) then stop
- Stop immediately if the user uploads a file or interacts with the buttons
- Use the theme's primary color for the light sweep effect
- Not replay during the same session once dismissed

## Visual Effect

The "running light" will be a diagonal shimmer that sweeps across the button surface:

```text
Before:        During animation:       After:
+--------+     +---/----+              +--------+
| Audio  |  →  | Au/dio |  →  (loops)  | Audio  |
+--------+     +---/----+              +--------+
```

The effect uses a semi-transparent gradient overlay that moves from left to right, creating a "light sweep" or "shimmer" effect.

---

## Technical Approach

### 1. CSS Animation (src/index.css)

Add a new keyframe animation for the shimmer effect:

```css
@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  position: relative;
  overflow: hidden;
}

.animate-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--primary) / 0.3) 50%,
    transparent 100%
  );
  animation: shimmer-sweep 1.5s ease-in-out infinite;
  pointer-events: none;
}
```

### 2. Component State (src/components/FileUploader.tsx)

Add state to control when the animation shows:

| State | Purpose |
|-------|---------|
| `showHint` | Boolean to control if shimmer animation is active |

Logic:
- Initialize `showHint = true` on mount
- Set `showHint = false` when:
  - User uploads either file (audio or script)
  - After a timeout (e.g., 8-10 seconds)
  - Or after a set number of animation cycles

### 3. Apply Animation Classes

Conditionally apply the `animate-shimmer` class to both upload button labels when `showHint` is true AND no files are uploaded yet:

```tsx
<label
  className={cn(
    "group relative cursor-pointer overflow-hidden",
    // ... existing classes
    showHint && !audioFile && !scriptFile && "animate-shimmer"
  )}
>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `shimmer-sweep` keyframe and `.animate-shimmer` utility class |
| `src/components/FileUploader.tsx` | Add `showHint` state with auto-dismiss timer, apply animation class conditionally |

## Summary

This creates a subtle but noticeable visual hint that naturally draws the user's eye to the upload buttons when they first open the app, without being intrusive or annoying.

