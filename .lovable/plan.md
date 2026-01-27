
# Fix Caption Display to Have a Fixed Height

## Problem
The caption display area currently uses `min-h-[300px]`, which sets a **minimum** height but allows the container to expand when there are more or longer sentences. You want a rigid, constant height that stays at 300px regardless of content.

## Solution
Change the CaptionDisplay component to use a fixed height (`h-[300px]`) instead of a minimum height, and ensure overflow is properly clipped. The existing gradient overlays at top and bottom will help mask the clipped content for a polished look.

---

## Changes Required

### File: `src/components/CaptionDisplay.tsx`

**Line 87 (Empty state):**
- Change `min-h-[300px]` to `h-[300px]`

**Line 94 (Main caption container):**
- Change `min-h-[300px]` to `h-[300px]`
- The existing `overflow-hidden` class will clip any content that exceeds the fixed height

---

## Visual Result

```text
Before (min-h-[300px]):
┌────────────────────────────────────┐
│  Sentence 1                        │
│  Sentence 2                        │  ← Height grows
│  Sentence 3 (very long text...)    │     with content
│  ...continues expanding...          │
└────────────────────────────────────┘

After (h-[300px]):
┌────────────────────────────────────┐
│  ░░░ gradient fade ░░░             │
│  Sentence 1                        │  ← Fixed 300px
│  Sentence 2 (current)              │     always
│  Sentence 3 (clipped if needed)    │
│  ░░░ gradient fade ░░░             │
└────────────────────────────────────┘
```

---

## Technical Details

| Location | Current | New |
|----------|---------|-----|
| Line 87 (empty state) | `min-h-[300px]` | `h-[300px]` |
| Line 94 (main container) | `min-h-[300px]` | `h-[300px]` |

The gradient overlays already in place (lines 96-97) will create a smooth fade effect at the top and bottom, making the clipped content look intentional and polished.
