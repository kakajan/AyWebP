#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  runConversion,
  getExitCode,
  printConversionSummary,
  parseQuality,
  parseResizeOptions,
} from '../src/run-conversion.js';
import { error } from '../src/logger.js';
import { DEFAULT_QUALITY } from '../src/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
);

const program = new Command();

program
  .name('aywebp')
  .description('Convert images to WebP beside the source files')
  .version(pkg.version)
  .argument('<path>', 'image file or directory')
  .option(
    '-q, --quality <number>',
    `WebP quality (1-100, default: ${DEFAULT_QUALITY})`,
    String(DEFAULT_QUALITY),
  )
  .option('-r, --recursive', 'scan subdirectories (e.g. aywebp ./images -r)', false)
  .option('-f, --force', 'overwrite existing .webp files', false)
  .option('-d, --delete-source', 'delete source file after successful conversion', false)
  .option('-W, --width <pixels>', 'resize to width in pixels (keeps aspect ratio if height omitted)')
  .option('-H, --height <pixels>', 'resize to height in pixels (keeps aspect ratio if width omitted)')
  .option(
    '--fit <mode>',
    'when width and height are both set: inside, cover, fill, or outside (default: inside)',
    'inside',
  )
  .option('--enlarge', 'allow upscaling images smaller than the target size', false)
  .option('--json', 'output structured JSON result on stdout', false)
  .action(async (inputPath, options) => {
    let quality;
    let resize;
    try {
      quality = parseQuality(options.quality);
      resize = parseResizeOptions({
        width: options.width,
        height: options.height,
        fit: options.fit,
        enlarge: options.enlarge,
      });
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    try {
      const result = await runConversion(inputPath, {
        recursive: options.recursive,
        quality,
        force: options.force,
        deleteSource: options.deleteSource,
        width: options.width,
        height: options.height,
        fit: options.fit,
        enlarge: options.enlarge,
        silent: options.json,
        validatePath: false,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printConversionSummary(result, { deleteSource: options.deleteSource });
      }

      process.exit(getExitCode(result));
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }));
      } else {
        error(err instanceof Error ? err.message : String(err));
      }
      process.exit(1);
    }
  });

program.parse();
