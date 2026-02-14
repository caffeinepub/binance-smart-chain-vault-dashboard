// Build information constants with environment variable support
// These can be overridden at build time via environment variables

// Read from environment or use defaults
const ENV_BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION;
const ENV_BUILD_DATE = import.meta.env.VITE_BUILD_DATE;
const ENV_BUILD_ID = import.meta.env.VITE_BUILD_ID;

export const BUILD_VERSION = ENV_BUILD_VERSION || 'v24';
export const BUILD_DATE = ENV_BUILD_DATE || '2026-02-13';
export const BUILD_IDENTIFIER = ENV_BUILD_ID || `${BUILD_VERSION}-${BUILD_DATE}`;

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
