import { getBuildVersion, getDeployedBuildId } from './buildInfo';

export interface PerformanceCheckData {
  buildId: string;
  buildVersion: string;
  timestamp: string;
  timeToAppMounted: number | null;
  navigationStart: number | null;
  domContentLoaded: number | null;
  loadComplete: number | null;
}

/**
 * Assembles performance check data for display and clipboard export.
 * Reads time-to-app-mounted from window-scoped value set by boot script.
 */
export function getPerformanceCheckData(): PerformanceCheckData {
  const buildId = getDeployedBuildId();
  const buildVersion = getBuildVersion();
  const timestamp = new Date().toISOString();

  // Read performance measurement from window scope (set by boot script)
  const timeToAppMounted = (window as any).__appMountedTime || null;

  // Browser navigation timing (if available)
  let navigationStart: number | null = null;
  let domContentLoaded: number | null = null;
  let loadComplete: number | null = null;

  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    navigationStart = timing.navigationStart;
    
    if (timing.domContentLoadedEventEnd && timing.navigationStart) {
      domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    }
    
    if (timing.loadEventEnd && timing.navigationStart) {
      loadComplete = timing.loadEventEnd - timing.navigationStart;
    }
  }

  return {
    buildId,
    buildVersion,
    timestamp,
    timeToAppMounted,
    navigationStart,
    domContentLoaded,
    loadComplete,
  };
}

/**
 * Formats performance check data as a readable text block for clipboard export.
 */
export function formatPerformanceCheckText(data: PerformanceCheckData): string {
  const lines = [
    'Digital Asset Vault - Performance Check',
    '========================================',
    '',
    `Build ID: ${data.buildId}`,
    `Build Version: ${data.buildVersion}`,
    `Timestamp: ${data.timestamp}`,
    '',
    'Performance Metrics:',
    '-------------------',
  ];

  if (data.timeToAppMounted !== null) {
    lines.push(`Time to App Mounted: ${data.timeToAppMounted.toFixed(0)} ms`);
  } else {
    lines.push('Time to App Mounted: Not available');
  }

  if (data.domContentLoaded !== null) {
    lines.push(`DOM Content Loaded: ${data.domContentLoaded.toFixed(0)} ms`);
  }

  if (data.loadComplete !== null) {
    lines.push(`Load Complete: ${data.loadComplete.toFixed(0)} ms`);
  }

  lines.push('');
  lines.push(`User Agent: ${navigator.userAgent}`);
  lines.push(`URL: ${window.location.href}`);

  return lines.join('\n');
}
