
# Reduce Size of Previous/Next Sentences in Caption Display

## Overview
Create a clearer visual hierarchy in the caption display by making the previous and next sentences smaller than the current running sentence. This keeps all three sentences visible in the fixed 300px area while emphasizing the active sentence.

---

## Current vs. Proposed

```text
CURRENT STATE:
┌─────────────────────────────────────┐
│  Previous sentence (3xl, opacity 20%)│
│  CURRENT SENTENCE (3xl, scale 105%) │
│  Next sentence (3xl, opacity 30%)   │
└─────────────────────────────────────┘
All sentences are the same size - only opacity differs

PROPOSED STATE:
┌─────────────────────────────────────┐
│  Previous sentence (lg, opacity 30%)│
│  CURRENT SENTENCE (3xl/4xl)         │
│  Next sentence (lg, opacity 40%)    │
└─────────────────────────────────────┘
Current sentence is prominent, surrounding sentences are smaller
```

---

## Changes Required

### File: `src/components/CaptionDisplay.tsx`

**Line 107-112** - Update the sentence container styling:

| Sentence Type | Current | Proposed |
|---------------|---------|----------|
| Current | `text-3xl md:text-4xl scale-105` | `text-3xl md:text-4xl` (no change to size) |
| Previous | `text-3xl md:text-4xl opacity-20` | `text-lg md:text-xl opacity-40` |
| Next | `text-3xl md:text-4xl opacity-30` | `text-lg md:text-xl opacity-50` |

**Updated class logic:**
- Current sentence: Keep `text-3xl md:text-4xl`, remove the scale (size difference will be enough)
- Previous sentence: Use `text-lg md:text-xl` with slightly higher opacity (`opacity-40`) for readability
- Next (upcoming) sentence: Use `text-lg md:text-xl` with `opacity-50`

---

## Visual Result

The current sentence will be approximately **2-3x larger** than the surrounding sentences, creating a clear focal point while still allowing you to see context before and after. The smaller surrounding text will also help fit more content within the fixed 300px height without overflow issues.
