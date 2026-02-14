# Specification

## Summary
**Goal:** Let users download an in-app ZIP bundle of the current project’s source code (including at least backend/ and frontend/) directly from the browser.

**Planned changes:**
- Implement client-side ZIP generation utilities in `frontend/src/lib/buildExport.ts`, `frontend/src/lib/zipWriter.ts`, and `frontend/src/lib/zipCrc32.ts` to produce valid, consistent ZIP files containing multiple files with paths.
- Collect and include the workspace’s shipped source files (e.g., `backend/main.mo` and key `frontend/src/` files) via a deterministic manifest-style approach that doesn’t rely on runtime filesystem APIs, and add a root `README.txt`/`README.md` with basic local run/build instructions.
- Implement `frontend/src/components/BuildExportButton.tsx` and place it in an existing, discoverable UI location (e.g., Footer or DiagnosticsBar), using existing UI primitives and showing progress/disabled state during export.
- Add error handling so ZIP-generation failures show an English toast/message without crashing, and name the downloaded ZIP file to include the app build identifier.

**User-visible outcome:** A user can click a “Download project ZIP” control in the app to download a build-identified `.zip` containing the project’s `backend/` and `frontend/` source structure plus a short README, with visible progress and safe error messaging.
