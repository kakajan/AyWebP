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
 * @param {string[]} inputPaths
 * @param {{ quality: number, force?: boolean, deleteSource?: boolean }} options
 * @returns {Promise<{ converted: number, skipped: number, failed: number, deleted: number }>}
 */
export async function convertImages(inputPaths, {
  quality,
  force = false,
  deleteSource = false,
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
        await sharp(inputPath).webp({ quality }).toFile(tempPath);
        await fs.rename(tempPath, outputPath);
      } else {
        await sharp(inputPath).webp({ quality }).toFile(outputPath);
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
