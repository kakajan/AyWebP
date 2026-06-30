import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import { assertPathAllowed } from './security.js';

/**
 * @param {string} imagePath
 * @param {{ validatePath?: boolean }} options
 */
export async function inspectImage(imagePath, { validatePath = true } = {}) {
  const resolved = validatePath ? assertPathAllowed(imagePath) : path.resolve(imagePath);

  let stat;
  try {
    stat = await fs.stat(resolved);
  } catch {
    throw new Error(`Path not found: ${resolved}`);
  }

  if (!stat.isFile()) {
    throw new Error(`Path is not a file: ${resolved}`);
  }

  const metadata = await sharp(resolved).metadata();

  return {
    path: resolved,
    format: metadata.format ?? null,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    size: stat.size,
    hasAlpha: metadata.hasAlpha ?? false,
  };
}
