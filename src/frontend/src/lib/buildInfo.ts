/**
 * Build information helper
 * Provides a build identifier for deployment verification
 */

export const BUILD_INFO = {
  version: 'v14',
  date: '2026-02-13',
  identifier: 'redeploy-2026-02-13-v14',
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
