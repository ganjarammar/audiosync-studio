

# Animated Luminous Border for Upload Buttons

## Overview

Add a neon-style animated border effect to the Audio and Script upload buttons where a glowing light continuously travels along the button's outline path, creating an eye-catching visual cue for new users.

## Visual Effect

The effect creates a glowing "light dot" that orbits around the pill-shaped button border:

```text
    ╭───────────────╮
   ●│   Audio       │     ← Glowing light travels clockwise
    ╰───────────────╯
         ↓ time
    ╭───────────────╮
    │   Audio      ●│
    ╰───────────────╯
```

The light will:
- Use the theme's primary color (matching user's accent color choice)
- Have a soft glow/blur effect for the neon aesthetic
- Animate smoothly in a continuous loop
- Stop once a file is uploaded (button shows completion state)

---

## Technical Approach

### 1. CSS Animation Setup

Create a keyframe animation that rotates a conic gradient around the button. This technique uses:
- A `::before` pseudo-element with a conic gradient (single bright spot fading to transparent)
- Rotation animation to make the bright spot travel around
- A `::after` pseudo-element to mask the inner area, leaving only the border visible

### 2. Animation Keyframes

```css
@keyframes border-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

### 3. Luminous Border Class Structure

The `.luminous-border` class will use:

| Element | Purpose |
|---------|---------|
| `::before` | Spinning conic gradient with glowing light spot |
| `::after` | Inner mask to create the hollow border effect |
| Base element | Contains the actual button content |

The conic gradient creates the traveling light:
```css
background: conic-gradient(
  from 0deg,
  transparent 0deg,
  hsl(var(--primary)) 10deg,
  hsl(var(--primary) / 0.5) 30deg,
  transparent 60deg,
  transparent 360deg
);
```

### 4. Component Integration

Add state to control animation visibility:
- `showAnimation`: Boolean, defaults to `true` on mount
- Animation stops when:
  - A file is uploaded (either audio or script)
  - After a timeout (optional, e.g., 15 seconds)

Apply the luminous border class conditionally:
```tsx
className={cn(
  // ... existing classes
  showAnimation && !audioFile && !scriptFile && "luminous-border"
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `@keyframes border-spin` animation and `.luminous-border` utility class with `::before` and `::after` pseudo-elements |
| `src/components/FileUploader.tsx` | Add `showAnimation` state with useEffect for auto-dismiss, apply `luminous-border` class conditionally to both upload labels |

---

## Technical Details

### CSS Implementation (src/index.css)

Add to `@layer utilities`:

1. **Keyframe animation** for continuous rotation
2. **`.luminous-border` class** with:
   - `position: relative` and `overflow: visible`
   - `::before` pseudo-element:
     - Positioned slightly outside the button (`inset: -2px`)
     - Conic gradient with bright spot
     - `border-radius: inherit` for pill shape
     - Spinning animation (3s duration)
     - Blur filter for glow effect
   - `::after` pseudo-element:
     - Positioned to cover the inner area
     - Background matches card color
     - Creates the hollow border effect
   - `z-index` management to keep content above the animation

### Component State (src/components/FileUploader.tsx)

```tsx
const [showAnimation, setShowAnimation] = useState(true);

useEffect(() => {
  // Auto-dismiss after 15 seconds
  const timer = setTimeout(() => setShowAnimation(false), 15000);
  return () => clearTimeout(timer);
}, []);

// Also stop when files are uploaded (handled in className logic)
```

---

## Summary

This creates a striking neon-style animated border that draws attention to the upload buttons while maintaining the existing glassmorphism aesthetic. The effect uses the user's selected theme color and automatically stops once files are uploaded or after a timeout period.

