
# Fix Update Button Visibility in Tauri v2

## Problem

The update button is not visible in the desktop app because the Tauri detection method is outdated. In Tauri v2, the `__TAURI__` global object is not automatically injected into the window - it requires explicit configuration or a different detection approach.

## Solution

There are two approaches to fix this:

### Option A: Enable Global Tauri Object (Quick Fix)

Add the `withGlobalTauri` option to `tauri.conf.json` to inject the `__TAURI__` object into the window, making the current detection work.

### Option B: Use Tauri v2 Detection Method (Recommended)

Update the detection logic in `UpdateButton.tsx` to use `@tauri-apps/api` which is the proper way to detect Tauri v2 environment.

I recommend **Option B** as it's the officially supported method for Tauri v2.

---

## Changes Required

### 1. Update UpdateButton.tsx - Fix Tauri Detection

Replace the old detection method with Tauri v2 compatible approach:

```text
Current (line 19):
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

New approach:
Use @tauri-apps/api to detect Tauri environment
```

The new detection will:
- Check if the `@tauri-apps/api` internals are available
- Use the proper Tauri v2 API pattern
- Work reliably in both development and production builds

### 2. Alternative: Update tauri.conf.json

If we want to keep backward compatibility, we could add the global Tauri object:

```json
{
  "app": {
    "withGlobalTauri": true,
    ...
  }
}
```

However, this is considered legacy in Tauri v2 and the API approach is preferred.

---

## Technical Details

### Detection Options for Tauri v2

| Method | Pros | Cons |
|--------|------|------|
| `window.__TAURI__` | Simple | Requires config change, legacy pattern |
| `window.__TAURI_INTERNALS__` | Built-in to Tauri v2 | Undocumented, may change |
| `navigator.userAgent` check | No dependency | Less reliable |
| Try/catch API import | Official pattern | Slightly more complex |

### Recommended Implementation

```tsx
// Check for Tauri v2 internals (always present in Tauri v2 apps)
const isTauri = typeof window !== "undefined" && 
  "__TAURI_INTERNALS__" in window;
```

Or the safer approach using environment:

```tsx
// Use Vite environment variable set during Tauri build
const isTauri = import.meta.env.TAURI_ENV_PLATFORM !== undefined;
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/UpdateButton.tsx` | Update Tauri detection from `__TAURI__` to `__TAURI_INTERNALS__` (Tauri v2 pattern) |

## Summary

The fix is a one-line change to use Tauri v2's internal detection marker instead of the v1 global object. After this change, the update button will appear in the desktop app header.
