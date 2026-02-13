# Specification

## Summary
**Goal:** Restore the app’s name/branding and any name-derived identifiers to match the Version 14 (or lower) naming so the app loads reliably and presents consistent English naming throughout the UI.

**Planned changes:**
- Update all user-facing app naming to the Version 14 (or lower) name across the HTML document title/metadata, boot fallback screen title, and in-app header/footer branding (including any responsive/short variants).
- Audit and revert any name-derived identifiers used at startup (e.g., build/identifier strings or identifier-derived links/values) back to their Version 14 (or lower) values to prevent load/mount failures.

**User-visible outcome:** The browser tab title, boot fallback screen, and in-app header/footer consistently display the Version 14 (or lower) app name in English, and the app mounts successfully without startup errors caused by renamed identifiers.
