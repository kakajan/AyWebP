import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * @param {string} inputPath
 * @returns {string}
 */
export function outputPathFor(inputPath) {
  const dir = path.dirname(inputPath);
  const stem = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${stem}.webp`);
}

/**
 * @param {string[]} inputPaths
 * @param {{ force?: boolean }} options
 */
export async function listConvertible(inputPaths, { force = false } = {}) {
  /** @type {Array<{ input: string, output: string, action: 'convert' | 'skip', reason?: string }>} */
  const files = [];
  let wouldConvert = 0;
  let wouldSkip = 0;

  for (const inputPath of inputPaths) {
    const outputPath = outputPathFor(inputPath);
    const samePath = path.resolve(inputPath) === path.resolve(outputPath);

    if (samePath && !force) {
      files.push({
        input: inputPath,
        output: outputPath,
        action: 'skip',
        reason: 'already_webp',
      });
      wouldSkip += 1;
      continue;
    }

    try {
      await fs.access(outputPath);
      if (!force) {
        files.push({
          input: inputPath,
          output: outputPath,
          action: 'skip',
          reason: 'output_exists',
        });
        wouldSkip += 1;
        continue;
      }
    } catch {
      // output does not exist
    }

    files.push({
      input: inputPath,
      output: outputPath,
      action: 'convert',
    });
    wouldConvert += 1;
  }

  return {
    total: inputPaths.length,
    wouldConvert,
    wouldSkip,
    files,
  };
}
