# Repository Rules for Agents

## Extension-first layout
- Keep `qa-locations-ext/` focused on the runnable browser extension only.
- Do not add tests, mocks, legacy code, or other reference-only artifacts inside `qa-locations-ext/`.

## Reference material placement
- Put legacy/reference material at the repository root (for example under `legacy/`).
- Legacy code is reference-only and must not be used as a runtime dependency for the extension.

## Ongoing cleanup direction
- Future PRs may continue removing legacy content.
- When moving non-extension assets out of `qa-locations-ext/`, preserve history with `git mv` when possible.
