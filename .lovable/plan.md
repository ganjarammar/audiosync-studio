
# Move Quick Actions to Main Content Area

## Current Issue
The Quick Actions menu is currently a small icon (lightning bolt) in the header that opens a dropdown. This makes it:
- Hard to discover (hidden behind a dropdown)
- Only visible when projects exist
- Less prominent than the feature deserves

## Recommended Position: Above the Empty State / Below Caption Display

The best placement is in the **main content area**, displayed as **3 horizontal action buttons**:

```text
+--------------------------------------------------+
|  Header: Logo  |  History | Vocab | Theme | etc  |
+--------------------------------------------------+
|                                                  |
|            [Caption Display Area]                |
|                                                  |
|  +------------+  +------------+  +------------+  |
|  | Continue   |  | Recently   |  | Play       |  |
|  | Listening  |  | Added      |  | Randomly   |  |
|  +------------+  +------------+  +------------+  |
|                                                  |
|            [Audio Player Controls]               |
|                                                  |
|            [File Uploader Area]                  |
+--------------------------------------------------+
```

## Why This Position?

1. **High visibility**: Users see the quick actions immediately
2. **Natural flow**: After the main content (captions), before file management
3. **Context-aware**: Can show different states when no projects exist vs. active playback
4. **Mobile-friendly**: Horizontal row stacks nicely on smaller screens

## Design Approach

### New Component: `QuickActionsBar`
Replace the dropdown with 3 styled buttons in a horizontal row:

| Button | Icon | Style | Description |
|--------|------|-------|-------------|
| Continue Listening | `PlayCircle` | Primary gradient | Shows last played name as subtitle |
| Recently Added | `Sparkles` | Outline/Secondary | Amber accent icon |
| Play Randomly | `Shuffle` | Outline/Secondary | Emerald accent icon |

### Visual Styling
- Glass/frosted background consistent with app design
- Hover effects matching the app's glow aesthetic
- Subtle animations on interaction
- Disabled state when no projects exist
- Hidden when no projects at all (to avoid confusion for new users)

### Placement in Index.tsx
Position between `CaptionDisplay`/empty state and `FileUploader`:

```text
{/* Caption or Empty State */}
{isReady ? <CaptionDisplay /> : <EmptyState />}

{/* Quick Actions Row - NEW */}
<QuickActionsBar onQuickLoad={handleQuickLoad} />

{/* Process Button */}
{canProcess && <Button>Generate Preview</Button>}

{/* File Uploader */}
<FileUploader />
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/QuickActionsMenu.tsx` | Refactor from dropdown to horizontal button bar |
| `src/pages/Index.tsx` | Move component from header to main content area |

## Technical Notes

- Remove the component from the header toolbar
- The horizontal layout uses flexbox with `gap-3` or `gap-4`
- On mobile, buttons can stack vertically or become compact
- Keep the same loading/project fetching logic
- Add subtle animations (scale on hover, loading spinner)
