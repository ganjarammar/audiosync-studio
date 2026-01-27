

# Center Current Sentence with First Sentence Exception

## Overview
Make the current running sentence vertically centered within the 300px caption display height, **except for the first sentence** which should remain at the top.

---

## Visual Concept

```text
FIRST SENTENCE (stays at top):
┌─────────────────────────────────┐
│  FIRST SENTENCE (current)       │  ← Top-aligned
│  Second sentence (next)         │
│                                 │
└─────────────────────────────────┘

SECOND+ SENTENCES (centered):
┌─────────────────────────────────┐
│          Previous sentence      │
│         CURRENT SENTENCE        │  ← Vertically centered
│          Next sentence          │
└─────────────────────────────────┘
```

---

## Changes Required

### File: `src/components/CaptionDisplay.tsx`

**1. Add conditional vertical centering based on sentence index**

Update line 99 to conditionally apply centering:
- When `currentSentenceIndex === 0`: Keep top-aligned (`pt-4`)
- When `currentSentenceIndex > 0`: Use flex centering (`flex flex-col justify-center h-full`)

**Code change:**
```jsx
// Line 99: Replace
<div className="space-y-8">

// With conditional layout
<div className={cn(
  "h-full",
  currentSentenceIndex === 0 
    ? "space-y-6 pt-4"  // Top-aligned for first sentence
    : "flex flex-col items-center justify-center gap-6"  // Centered for others
)}>
```

**2. Remove unnecessary top padding from container**

The parent container at line 94 has `p-8 md:p-12`. For proper vertical centering, we need to account for this padding. Adding `h-full` to the inner container ensures it uses all available vertical space for centering calculations.

---

## Technical Summary

| Condition | Layout | Alignment |
|-----------|--------|-----------|
| First sentence (`index === 0`) | Stack with `space-y-6` | Top-aligned with `pt-4` |
| Other sentences (`index > 0`) | Flexbox with `justify-center` | Vertically centered in 300px area |

---

## Result

- **First sentence**: Stays at the top of the display with the next sentence below it
- **All other sentences**: The current sentence is vertically centered, with previous sentences above and next sentences below, automatically adjusting positions to keep the current sentence anchored in the middle of the 300px height

