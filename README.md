# QR Locations MVP Extension

MVP browser extension based on `PLAN.md`:

- Two fields: `Locations` and `Priorities`.
- `Create` and `Reset` buttons.
- Priority code sorting for values like `SS4:HV253.A`.
- Duplicate entries are removed case-insensitively before rendering.
- Configurable arrangement settings (columns and fill mode).
- Results view with a table and priority highlighting.
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
