// Build information constants
export const BUILD_VERSION = 'v23';
export const BUILD_DATE = '2026-02-13';
export const BUILD_IDENTIFIER = `v23-${BUILD_DATE}`;

/**
 * Get the build version string
 */
export function getBuildVersion(): string {
  return BUILD_VERSION;
}

/**
 * Get the build date string
 */
export function getBuildDate(): string {
  return BUILD_DATE;
}

/**
 * Get the build identifier (version + date)
 */
export function getBuildIdentifier(): string {
  return BUILD_IDENTIFIER;
}

/**
 * Get the deployed build ID from the meta tag
 * Falls back to the static identifier if meta tag is not found
 */
export function getDeployedBuildId(): string {
  const buildIdMeta = document.querySelector('meta[name="build-id"]');
  if (buildIdMeta) {
    const content = buildIdMeta.getAttribute('content');
    if (content && content !== 'unknown') {
      return content;
    }
  }
  return BUILD_IDENTIFIER;
}
