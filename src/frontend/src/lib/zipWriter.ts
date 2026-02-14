/**
 * Lightweight in-browser ZIP writer
 * Creates ZIP files using store (no compression) method with proper CRC32 checksums
 */

import { crc32 } from './zipCrc32';

interface ZipEntry {
  path: string;
  data: Uint8Array;
  timestamp?: Date;
}

/**
 * Convert a Date to DOS date/time format
 */
function toDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;

  return { dosDate, dosTime };
}

/**
 * Write a 16-bit little-endian integer
 */
function writeUint16LE(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

/**
 * Write a 32-bit little-endian integer
 */
function writeUint32LE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true);
}

/**
 * Create a ZIP file from an array of entries
 */
export function createZip(entries: ZipEntry[]): Uint8Array {
  const now = new Date();
  const { dosDate, dosTime } = toDosDateTime(now);

  // Calculate total size needed
  let totalSize = 0;
  const processedEntries: Array<{
    path: Uint8Array;
    data: Uint8Array;
    crc: number;
    localHeaderOffset: number;
  }> = [];

  // First pass: calculate sizes and prepare entries
  for (const entry of entries) {
    const pathBytes = new TextEncoder().encode(entry.path);
    const crcValue = crc32(entry.data);

    // Local file header size: 30 + filename length + data length
    const localHeaderSize = 30 + pathBytes.length + entry.data.length;
    
    processedEntries.push({
      path: pathBytes,
      data: entry.data,
      crc: crcValue,
      localHeaderOffset: totalSize,
    });

    totalSize += localHeaderSize;
  }

  const centralDirStart = totalSize;

  // Central directory size: 46 + filename length per entry
  for (const entry of processedEntries) {
    totalSize += 46 + entry.path.length;
  }

  const centralDirSize = totalSize - centralDirStart;

  // End of central directory: 22 bytes
  totalSize += 22;

  // Create output buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  // Write local file headers and data
  for (const entry of processedEntries) {
    // Local file header signature
    writeUint32LE(view, offset, 0x04034b50);
    offset += 4;

    // Version needed to extract (2.0)
    writeUint16LE(view, offset, 20);
    offset += 2;

    // General purpose bit flag
    writeUint16LE(view, offset, 0);
    offset += 2;

    // Compression method (0 = store, no compression)
    writeUint16LE(view, offset, 0);
    offset += 2;

    // Last mod file time
    writeUint16LE(view, offset, dosTime);
    offset += 2;

    // Last mod file date
    writeUint16LE(view, offset, dosDate);
    offset += 2;

    // CRC-32
    writeUint32LE(view, offset, entry.crc);
    offset += 4;

    // Compressed size
    writeUint32LE(view, offset, entry.data.length);
    offset += 4;

    // Uncompressed size
    writeUint32LE(view, offset, entry.data.length);
    offset += 4;

    // File name length
    writeUint16LE(view, offset, entry.path.length);
    offset += 2;

    // Extra field length
    writeUint16LE(view, offset, 0);
    offset += 2;

    // File name
    bytes.set(entry.path, offset);
    offset += entry.path.length;

    // File data
    bytes.set(entry.data, offset);
    offset += entry.data.length;
  }

  // Write central directory
  for (const entry of processedEntries) {
    // Central directory file header signature
    writeUint32LE(view, offset, 0x02014b50);
    offset += 4;

    // Version made by (Unix)
    writeUint16LE(view, offset, 0x031E);
    offset += 2;

    // Version needed to extract
    writeUint16LE(view, offset, 20);
    offset += 2;

    // General purpose bit flag
    writeUint16LE(view, offset, 0);
    offset += 2;

    // Compression method
    writeUint16LE(view, offset, 0);
    offset += 2;

    // Last mod file time
    writeUint16LE(view, offset, dosTime);
    offset += 2;

    // Last mod file date
    writeUint16LE(view, offset, dosDate);
    offset += 2;

    // CRC-32
    writeUint32LE(view, offset, entry.crc);
    offset += 4;

    // Compressed size
    writeUint32LE(view, offset, entry.data.length);
    offset += 4;

    // Uncompressed size
    writeUint32LE(view, offset, entry.data.length);
    offset += 4;

    // File name length
    writeUint16LE(view, offset, entry.path.length);
    offset += 2;

    // Extra field length
    writeUint16LE(view, offset, 0);
    offset += 2;

    // File comment length
    writeUint16LE(view, offset, 0);
    offset += 2;

    // Disk number start
    writeUint16LE(view, offset, 0);
    offset += 2;

    // Internal file attributes
    writeUint16LE(view, offset, 0);
    offset += 2;

    // External file attributes
    writeUint32LE(view, offset, 0);
    offset += 4;

    // Relative offset of local header
    writeUint32LE(view, offset, entry.localHeaderOffset);
    offset += 4;

    // File name
    bytes.set(entry.path, offset);
    offset += entry.path.length;
  }

  // Write end of central directory record
  // Signature
  writeUint32LE(view, offset, 0x06054b50);
  offset += 4;

  // Number of this disk
  writeUint16LE(view, offset, 0);
  offset += 2;

  // Disk where central directory starts
  writeUint16LE(view, offset, 0);
  offset += 2;

  // Number of central directory records on this disk
  writeUint16LE(view, offset, processedEntries.length);
  offset += 2;

  // Total number of central directory records
  writeUint16LE(view, offset, processedEntries.length);
  offset += 2;

  // Size of central directory
  writeUint32LE(view, offset, centralDirSize);
  offset += 4;

  // Offset of start of central directory
  writeUint32LE(view, offset, centralDirStart);
  offset += 4;

  // ZIP file comment length
  writeUint16LE(view, offset, 0);

  return bytes;
}
