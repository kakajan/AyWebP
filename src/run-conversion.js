import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { warn, info } from './logger.js';
import { collectInputs } from './collect-inputs.js';
import { convertImages, parseQuality, parseResizeOptions } from './convert.js';
import { listConvertible } from './list-convertible.js';
import { assertPathAllowed } from './security.js';

/**
 * @param {string} inputPath
 * @param {{
 *   recursive?: boolean,
 *   quality?: number | string,
 *   force?: boolean,
 *   deleteSource?: boolean,
 *   width?: string | number,
 *   height?: string | number,
 *   fit?: string,
 *   enlarge?: boolean,
 *   silent?: boolean,
 *   dryRun?: boolean,
 *   validatePath?: boolean,
 * }} options
 */
export async function runConversion(inputPath, options = {}) {
  const {
    recursive = false,
    force = false,
    deleteSource = false,
    silent = false,
    dryRun = false,
    validatePath = true,
    fit = 'inside',
    enlarge = false,
  } = options;

  const resolved = validatePath
    ? assertPathAllowed(inputPath)
    : path.resolve(inputPath);

  const quality = parseQuality(options.quality ?? 85);
  const resize = parseResizeOptions({
    width: options.width,
    height: options.height,
    fit,
    enlarge,
  });

  const inputFiles = await collectInputs(resolved, { recursive });

  if (dryRun) {
    return listConvertible(inputFiles, { force });
  }

  const result = await convertImages(inputFiles, {
    quality,
    force,
    deleteSource,
    resize,
    silent,
  });

  return {
    ...result,
    total: inputFiles.length,
  };
}

/**
 * @param {{
 *   converted: number,
 *   skipped: number,
 *   failed: number,
 *   deleted?: number,
 *   total: number,
 * }} summary
 * @returns {number}
 */
export function getExitCode(summary) {
  const { converted, skipped, failed, total } = summary;
  if (converted === 0 && failed > 0) {
    return 2;
  }
  if (converted === 0 && skipped === total) {
    return 0;
  }
  if (failed > 0) {
    return 2;
  }
  return 0;
}

/**
 * @param {{
 *   converted: number,
 *   skipped: number,
 *   failed: number,
 *   deleted?: number,
 *   total: number,
 * }} summary
 * @param {{ deleteSource?: boolean }} options
 */
export function printConversionSummary(summary, { deleteSource = false } = {}) {
  const deletedPart =
    deleteSource && (summary.deleted ?? 0) > 0 ? `, ${summary.deleted} deleted` : '';
  info('');
  info(
    `Done: ${summary.converted} converted, ${summary.skipped} skipped, ${summary.failed} failed${deletedPart} (${summary.total} total).`,
  );
}

// Re-export parsers for MCP/CLI convenience
export { parseQuality, parseResizeOptions } from './convert.js';
