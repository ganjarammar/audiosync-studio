

# Fix Missing latest.json in GitHub Release

## Problem

The v1.0.2 release exists on GitHub, but it's missing the `latest.json` file that the Tauri updater needs. This is because the release was created manually on GitHub instead of being built by the GitHub Actions workflow.

The Tauri updater plugin requires:
1. A `latest.json` file containing version info and download URLs
2. A signed `.msi.zip` (or `.nsis.zip`) installer
3. A `.sig` signature file for the installer

These are only generated when the `tauri-action` workflow runs with `includeUpdaterJson: true`.

---

## Solution

You need to re-run the GitHub Actions workflow to properly build and upload the release assets.

### Step 1: Delete the existing v1.0.2 release

1. Go to https://github.com/ganjarammar/audiosync-studio/releases
2. Find the v1.0.2 release
3. Click "Delete release" (but **keep the tag** if it exists, or delete it too)

### Step 2: Trigger the workflow

**Option A - Push a new tag (if you deleted the tag):**
```bash
git tag v1.0.2
git push origin v1.0.2
```

**Option B - Manually trigger the workflow (if tag still exists):**
1. Go to https://github.com/ganjarammar/audiosync-studio/actions
2. Click on "Release" workflow in the left sidebar
3. Click "Run workflow" button
4. Select the branch (main) and click "Run workflow"

### Step 3: Wait for the build

The workflow will:
1. Build the Tauri app for Windows
2. Create/update the GitHub Release
3. Upload the installer (.msi.zip)
4. Upload the signature file (.sig)
5. Upload the `latest.json` file

This typically takes 5-10 minutes.

### Step 4: Verify

After the workflow completes, check that these files exist in the release:
- `PodLingo_1.0.2_x64_en-US.msi.zip`
- `PodLingo_1.0.2_x64_en-US.msi.zip.sig`
- `latest.json`

Then the update button should work.

---

## What latest.json looks like

For reference, the `latest.json` file should contain something like:

```json
{
  "version": "1.0.2",
  "notes": "See the assets to download and install this version.",
  "pub_date": "2025-02-05T...",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/ganjarammar/audiosync-studio/releases/download/v1.0.2/PodLingo_1.0.2_x64_en-US.msi.zip"
    }
  }
}
```

---

## Summary

| Step | Action |
|------|--------|
| 1 | Delete the manually-created v1.0.2 release on GitHub |
| 2 | Trigger the Release workflow (manually or via tag push) |
| 3 | Wait for workflow to complete (~5-10 min) |
| 4 | Verify latest.json appears in release assets |
| 5 | Test the update button in the app |

No code changes are needed - the workflow configuration is correct. The issue is that the workflow wasn't used to create the release.

