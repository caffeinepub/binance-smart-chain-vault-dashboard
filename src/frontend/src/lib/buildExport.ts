/**
 * Client-side build export utility
 * Assembles project files and packages them into a downloadable ZIP
 */

import { createZip } from './zipWriter';
import { getBackendSources, getFrontendConfigSources, generateReadme } from './exportSourceManifest';
import { getDeployedBuildId } from './buildInfo';

export interface ExportProgress {
  stage: string;
  current: number;
  total: number;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
}

/**
 * Fetch a text file from the deployed application
 */
async function fetchTextFile(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Discover and fetch frontend source files from the deployed build
 */
async function discoverFrontendSources(
  onProgress?: (progress: ExportProgress) => void
): Promise<Array<{ path: string; content: string }>> {
  const sources: Array<{ path: string; content: string }> = [];

  // Fetch index.html
  onProgress?.({ stage: 'Fetching index.html', current: 0, total: 1 });
  const indexHtml = await fetchTextFile('/index.html');
  if (indexHtml) {
    sources.push({ path: 'frontend/index.html', content: indexHtml });
  }

  // Fetch health.html
  onProgress?.({ stage: 'Fetching health.html', current: 1, total: 2 });
  const healthHtml = await fetchTextFile('/health.html');
  if (healthHtml) {
    sources.push({ path: 'frontend/public/health.html', content: healthHtml });
  }

  return sources;
}

/**
 * Export the project as a ZIP file
 */
export async function exportProjectZip(
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const allSources: Array<{ path: string; content: string }> = [];

  // Add README
  onProgress?.({ stage: 'Generating README', current: 0, total: 5 });
  allSources.push({
    path: 'README.md',
    content: generateReadme(),
  });

  // Add backend sources
  onProgress?.({ stage: 'Collecting backend sources', current: 1, total: 5 });
  const backendSources = getBackendSources();
  allSources.push(...backendSources);

  // Add frontend config files
  onProgress?.({ stage: 'Collecting frontend config', current: 2, total: 5 });
  const configSources = getFrontendConfigSources();
  allSources.push(...configSources);

  // Discover and fetch frontend sources
  onProgress?.({ stage: 'Discovering frontend sources', current: 3, total: 5 });
  const frontendSources = await discoverFrontendSources(onProgress);
  allSources.push(...frontendSources);

  // Create ZIP
  onProgress?.({ stage: 'Creating ZIP file', current: 4, total: 5 });
  const zipEntries = allSources.map(source => ({
    path: source.path,
    data: new TextEncoder().encode(source.content),
  }));

  const zipBytes = createZip(zipEntries);
  
  // Create a new Uint8Array to ensure proper ArrayBuffer type for Blob
  const zipData = new Uint8Array(zipBytes);
  const blob = new Blob([zipData], { type: 'application/zip' });

  // Generate filename with build ID
  const buildId = getDeployedBuildId();
  const filename = `digital-asset-vault-${buildId}.zip`;

  onProgress?.({ stage: 'Complete', current: 5, total: 5 });

  return { blob, filename };
}

/**
 * Trigger a browser download of the ZIP file
 */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
