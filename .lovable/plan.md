

# Smart Caption Text Management Implementation

## Overview

This plan implements intelligent sentence measurement that dynamically determines how many sentences can fit within a fixed 400px container, ensuring the display never overflows while maximizing visible content.

## Current Behavior vs. New Behavior

```text
CURRENT (problematic):
┌────────────────────────────────────┐
│ Previous sentence that is very    │  ↑
│ long and wraps to multiple lines  │  │ Height varies based
│ Current sentence being spoken now │  │ on sentence lengths
│ Next sentence coming up soon      │  │
└────────────────────────────────────┘  ↓

NEW (fixed 400px with smart measurement):
┌────────────────────────────────────┐
│                                   │  ↑
│ Previous sentence (if fits)       │  │ 
│ CURRENT SENTENCE (always shown)   │  │ Fixed 400px
│ Next sentence (if fits)           │  │
│                                   │  ↓
└────────────────────────────────────┘
```

## Technical Approach

### Measurement Strategy

The component will use a "hidden measurement div" technique:

1. **Create an off-screen measurement container** with identical styles (font size, padding, width)
2. **Render each sentence into the hidden div** and measure its actual rendered height
3. **Cache measured heights** for performance (sentences don't change during playback)
4. **Dynamically calculate** which sentences fit based on measured heights

```text
Measurement Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. Component mounts with sentences                          │
│ 2. Create hidden div (visibility:hidden, position:absolute) │
│ 3. For each sentence:                                       │
│    - Render to hidden div                                   │
│    - Read offsetHeight                                      │
│    - Store in heightMap: { sentenceIndex → height }         │
│ 4. Calculate visible sentences based on 400px budget        │
└─────────────────────────────────────────────────────────────┘
```

### Visibility Calculation Algorithm

```text
Available height: 400px - padding (p-8 = 32px × 2 = 64px) = 336px usable

Priority order:
1. CURRENT sentence (always shown, regardless of height)
2. PREVIOUS sentence (if remaining space allows)
3. NEXT sentence (if remaining space allows)
4. Additional context sentences (if still room)

Example calculation:
- Total budget: 336px
- Current sentence height: 80px → remaining: 256px
- Previous sentence height: 70px → remaining: 186px → SHOW
- Next sentence height: 90px → remaining: 96px → SHOW
- Sentence before previous: 85px → not enough space → HIDE
```

### Responsive Width Handling

Sentence heights change based on container width (text wrapping). The implementation will:

1. Use `ResizeObserver` on the container
2. Re-measure heights when width changes
3. Recalculate visible sentences

---

## Implementation Details

### File: `src/components/CaptionDisplay.tsx`

**Changes:**

1. **Add new hooks and refs:**
   - `containerRef` - Reference to the main container for width observation
   - `measureRef` - Reference to hidden measurement div
   - `heightMapRef` - Cached sentence heights

2. **Add measurement effect:**
   - Creates hidden div with matching styles
   - Measures each sentence's rendered height
   - Stores results in a Map

3. **Replace fixed window logic:**
   - Current: `slice(startIdx, startIdx + 3)` (always 3 sentences)
   - New: Calculate based on measured heights and available space

4. **Add ResizeObserver:**
   - Watch container width changes
   - Trigger re-measurement when width changes

5. **Update container styles:**
   - Change `min-h-[300px]` to `h-[400px]`
   - Keep `overflow-hidden`
   - Add flex layout for vertical centering (per existing memory)

### New Component Structure

```text
<div ref={containerRef} className="h-[400px] overflow-hidden ...">
  {/* Hidden measurement div */}
  <div ref={measureRef} className="invisible absolute ..." aria-hidden>
    {/* Sentences rendered here for measurement */}
  </div>
  
  {/* Visible content area */}
  <div className="flex flex-col justify-center h-full">
    {/* Gradient overlays */}
    {/* Dynamically calculated visible sentences */}
  </div>
</div>
```

### State & Logic Flow

```text
sentences + currentSentenceIndex
        ↓
┌───────────────────┐
│  measureHeights() │ ← Triggered on mount + resize
└─────────┬─────────┘
          ↓
    heightMap (cached)
          ↓
┌─────────────────────────────┐
│  calculateVisibleSentences() │
│  - Start with current        │
│  - Add previous if fits      │
│  - Add next if fits          │
│  - Continue until budget = 0 │
└─────────────────────────────┘
          ↓
  visibleSentences array
          ↓
      Render only those
```

---

## Visual Centering Logic

Per existing project memory, the current sentence should be vertically centered (except for the first sentence which stays top-aligned). The implementation will:

1. Calculate the vertical position to center the current sentence
2. Use flexbox `justify-center` for the sentence container
3. Apply conditional alignment for the first sentence

---

## Technical Notes

### Performance Considerations

- **Measurement caching**: Heights are only re-measured when sentences change or container width changes
- **Memoization**: `visibleSentences` calculation is wrapped in `useMemo`
- **No layout thrashing**: Hidden div uses `visibility: hidden` (not `display: none`) to allow measurement without reflow

### Edge Cases Handled

1. **Single sentence longer than container**: Still shown, content clips gracefully with gradient overlay
2. **Very short sentences**: More sentences become visible automatically
3. **Responsive breakpoints**: Re-measurement handles font size changes (`text-2xl md:text-3xl`)
4. **First/last sentence**: Proper boundary handling without array overflow

### Gap Spacing

The current `space-y-8` (32px gap) must be accounted for in height calculations:
- Each additional sentence adds its height + 32px gap
- Budget calculation: `remaining - sentenceHeight - 32`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/CaptionDisplay.tsx` | Modify | Add measurement system, resize observer, dynamic visibility calculation, fixed 400px height |

---

## Expected Behavior After Implementation

1. **Fixed height**: Container stays exactly 400px regardless of content
2. **Smart fitting**: Shows maximum sentences that fit without overflow
3. **Current sentence priority**: Always visible, centered (except first)
4. **Responsive**: Adjusts automatically when window resizes
5. **Smooth experience**: No jarring height changes during playback

