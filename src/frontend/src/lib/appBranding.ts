/**
 * Application branding constants
 * Single source of truth for app name and branding strings (Version 14)
 */

export const APP_BRANDING = {
  // Full app name for headers, titles, and formal contexts
  fullName: 'Digital Asset Vault',
  
  // Short name for mobile/responsive contexts
  shortName: 'Asset Vault',
  
  // Tagline/subtitle
  tagline: 'BSC Secure Storage',
  
  // App identifier for analytics/attribution (stable, URL-safe)
  identifier: 'digital-asset-vault',
  
  // Icon emoji
  icon: '🛡️',
} as const;

export function getAppName(short: boolean = false): string {
  return short ? APP_BRANDING.shortName : APP_BRANDING.fullName;
}

export function getAppIdentifier(): string {
  return APP_BRANDING.identifier;
}
