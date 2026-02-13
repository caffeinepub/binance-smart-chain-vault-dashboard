# Specification

## Summary
**Goal:** Remove the ZIP build export feature and all ZIP-related references from the app.

**Planned changes:**
- Remove the “Build Export” section/card from the Diagnostics bar UI, including the download button, progress text, and any ZIP-focused deployment instructions.
- Delete ZIP-export-related frontend implementation code paths (e.g., usage of exportFrontendBuild/downloadBlob and ZIP writer logic) so the app no longer generates or downloads ZIP files.
- Clean up related imports/references (e.g., DiagnosticsBar no longer references ZIP export modules) and ensure the app builds without unused/invalid imports.

**User-visible outcome:** The Diagnostics bar no longer shows a Build Export section, and the app contains no user-facing text or functionality related to downloading or extracting a ZIP build export.
