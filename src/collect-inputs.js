import path from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { GLOB_EXTENSIONS, SUPPORTED_EXTENSIONS } from './constants.js';

function hasSupportedExtension(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * @param {string} inputPath
 * @param {{ recursive?: boolean }} options
 * @returns {Promise<string[]>}
 */
export async function collectInputs(inputPath, { recursive = false } = {}) {
  const resolved = path.resolve(inputPath);

  let stat;
  try {
    stat = await fs.stat(resolved);
  } catch {
    throw new Error(`Path not found: ${resolved}`);
  }

  if (stat.isFile()) {
    if (!hasSupportedExtension(resolved)) {
      throw new Error(
        `Unsupported file type: ${path.extname(resolved)}. Supported: ${[...SUPPORTED_EXTENSIONS].join(', ')}`,
      );
    }
    return [resolved];
  }

  if (!stat.isDirectory()) {
    throw new Error(`Path is not a file or directory: ${resolved}`);
  }

  const pattern = recursive
    ? `**/*.${GLOB_EXTENSIONS}`
    : `*.${GLOB_EXTENSIONS}`;

  const files = await fg(pattern, {
    cwd: resolved,
    absolute: true,
    onlyFiles: true,
    caseSensitiveMatch: false,
  });

  if (files.length === 0) {
    throw new Error(
      recursive
        ? `No supported images found in ${resolved}. Check file extensions.`
        : `No supported images found in ${resolved}. Try --recursive to scan subdirectories.`,
    );
  }

  return files.sort();
}
