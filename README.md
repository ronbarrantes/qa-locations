# QR Locations MVP Extension

MVP browser extension based on `references/PLAN.md`:

- Two fields: `Locations` and `Priorities`.
- `Create` and `Reset` buttons.
- Priority code sorting for values like `SS4:HV253.A`.
- Duplicate entries are removed case-insensitively before rendering.
- QA-script-like rules settings modal with:
  - add/remove/edit groups,
  - drag/drop group reordering,
  - max rows and column gap settings.
- Settings are saved in extension local storage (`localStorage`).
- Results view renders grouped tables and highlights priorities.
- Zip packaging script for distribution.

## Run locally

1. Open Chromium-based browser extension settings.
2. Enable developer mode.
3. Load unpacked extension from this folder.
4. Open the extension popup.

## Build distribution zip

```bash
./build-zip.sh
```

Output:

- `dist/qr-locations-mvp.zip` (generated artifact; not committed to git)


## Repository layout

- Extension source remains at repository root for straightforward Chrome loading/building.
- Legacy/reference projects are kept under `references/` (`references/qa-script`, `references/qr-ext`) so non-extension code is separated.
