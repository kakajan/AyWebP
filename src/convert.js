import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { warn, info } from './logger.js';

function outputPathFor(inputPath) {
  const dir = path.dirname(inputPath);
  const stem = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${stem}.webp`);
}

/**
 * @param {import('sharp').Sharp} pipeline
 * @param {import('sharp').ResizeOptions | undefined} resize
 */
function applyResize(pipeline, resize) {
  if (!resize) {
    return pipeline;
  }
  return pipeline.resize(resize);
}

/**
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {{ quality: number, resize?: import('sharp').ResizeOptions }} options
 */
async function encodeToWebp(inputPath, outputPath, { quality, resize }) {
  const pipeline = applyResize(sharp(inputPath), resize);
  await pipeline.webp({ quality }).toFile(outputPath);
}

/**
 * @param {string[]} inputPaths
 * @param {{
 *   quality: number,
 *   force?: boolean,
 *   deleteSource?: boolean,
 *   resize?: import('sharp').ResizeOptions,
 * }} options
 * @returns {Promise<{ converted: number, skipped: number, failed: number, deleted: number }>}
 */
export async function convertImages(inputPaths, {
  quality,
  force = false,
  deleteSource = false,
  resize,
}) {
  let converted = 0;
  let skipped = 0;
  let failed = 0;
  let deleted = 0;

  for (const inputPath of inputPaths) {
    const outputPath = outputPathFor(inputPath);
    const samePath = path.resolve(inputPath) === path.resolve(outputPath);

    if (samePath && !force) {
      warn(`Skipped (already WebP): ${inputPath}`);
      skipped += 1;
      continue;
    }

    try {
      await fs.access(outputPath);
      if (!force) {
        warn(`Skipped (exists): ${outputPath}`);
        skipped += 1;
        continue;
      }
    } catch {
      // output does not exist — proceed
    }

    try {
      if (samePath) {
        const tempPath = `${outputPath}.tmp`;
        await encodeToWebp(inputPath, tempPath, { quality, resize });
        await fs.rename(tempPath, outputPath);
      } else {
        await encodeToWebp(inputPath, outputPath, { quality, resize });
      }
      info(`Converted: ${inputPath} → ${outputPath}`);
      converted += 1;

      if (deleteSource && !samePath) {
        try {
          await fs.unlink(inputPath);
          info(`Deleted source: ${inputPath}`);
          deleted += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          warn(`Failed to delete source: ${inputPath} (${message})`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warn(`Failed: ${inputPath} (${message})`);
      failed += 1;
    }
  }

  return { converted, skipped, failed, deleted };
}

/**
 * @param {string | number} value
 * @returns {number}
 */
export function parseQuality(value) {
  const quality = Number.parseInt(String(value), 10);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error('Quality must be an integer between 1 and 100.');
  }
  return quality;
}

/**
 * @param {string | number} value
 * @param {string} label
 * @returns {number}
 */
function parseDimension(value, label) {
  const dimension = Number.parseInt(String(value), 10);
  if (!Number.isInteger(dimension) || dimension < 1) {
    throw new Error(`${label} must be a positive integer (pixels).`);
  }
  return dimension;
}

/**
 * @param {{ width?: string | number, height?: string | number, fit?: string, enlarge?: boolean }} options
 * @returns {import('sharp').ResizeOptions | undefined}
 */
export function parseResizeOptions({ width, height, fit, enlarge = false }) {
  const hasWidth = width !== undefined;
  const hasHeight = height !== undefined;

  if (!hasWidth && !hasHeight) {
    return undefined;
  }

  const parsedWidth = hasWidth ? parseDimension(width, 'Width') : undefined;
  const parsedHeight = hasHeight ? parseDimension(height, 'Height') : undefined;

  if (hasWidth && hasHeight) {
    const allowedFit = new Set(['inside', 'cover', 'fill', 'outside']);
    const fitMode = fit ?? 'inside';
    if (!allowedFit.has(fitMode)) {
      throw new Error('Fit must be one of: inside, cover, fill, outside.');
    }
    return {
      width: parsedWidth,
      height: parsedHeight,
      fit: /** @type {import('sharp').FitEnum} */ (fitMode),
      withoutEnlargement: !enlarge,
    };
  }

  if (parsedWidth !== undefined) {
    return { width: parsedWidth, withoutEnlargement: !enlarge };
  }

  return { height: parsedHeight, withoutEnlargement: !enlarge };
}
