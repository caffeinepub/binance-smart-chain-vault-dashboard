/**
 * Build information helper
 * Provides build identifier and version for deployment verification
 */

export const BUILD_INFO = {
  version: 'v14',
  date: '2026-02-13',
  identifier: 'rollback-v14-2026-02-13',
} as const;

export function getBuildIdentifier(): string {
  return BUILD_INFO.identifier;
}

export function getBuildVersion(): string {
  return BUILD_INFO.version;
}

export function getBuildDate(): string {
  return BUILD_INFO.date;
}

/**
 * Get the deployed build ID from the meta tag, with fallback to static identifier
 */
export function getDeployedBuildId(): string {
  if (typeof document !== 'undefined') {
    const buildIdMeta = document.querySelector('meta[name="build-id"]');
    if (buildIdMeta) {
      return buildIdMeta.getAttribute('content') || BUILD_INFO.identifier;
    }
  }
  return BUILD_INFO.identifier;
}
