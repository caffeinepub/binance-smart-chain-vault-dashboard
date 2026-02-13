# Specification

## Summary
**Goal:** Improve deployment stability diagnosis by adding a static reachability page, in-app performance self-check, and clearer boot fallback messaging with build identification.

**Planned changes:**
- Add a static, no-JavaScript reachability page at a stable path (e.g., `/health.html`) that loads without the React app and displays the current build identifier.
- Add a “Performance check” section to the existing in-app Diagnostics UI that reports basic load timing (including time to `app-mounted` and navigation timing when available), plus build ID and timestamp, with a one-click copy-to-clipboard output.
- Ensure the existing boot fallback screen keeps clear, consistent English text for its current failure modes (resource/script load failure, network/connection issue, runtime error) and displays the build identifier in all non-success states.

**User-visible outcome:** Users can open `/health.html` to confirm reachability and build version even if the app won’t boot, view a Performance check inside Diagnostics with copyable timing data, and see clearer fallback error messaging that includes the build ID during load failures.
