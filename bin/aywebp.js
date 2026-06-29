#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { collectInputs } from '../src/collect-inputs.js';
import { convertImages, parseQuality } from '../src/convert.js';
import { error, info } from '../src/logger.js';
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
  .action(async (inputPath, options) => {
    let quality;
    try {
      quality = parseQuality(options.quality);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    let files;
    try {
      files = await collectInputs(inputPath, { recursive: options.recursive });
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    const { converted, skipped, failed, deleted } = await convertImages(files, {
      quality,
      force: options.force,
      deleteSource: options.deleteSource,
    });

    info('');
    const deletedPart =
      options.deleteSource && deleted > 0 ? `, ${deleted} deleted` : '';
    info(
      `Done: ${converted} converted, ${skipped} skipped, ${failed} failed${deletedPart} (${files.length} total).`,
    );

    if (converted === 0 && failed > 0) {
      process.exit(2);
    }
    if (converted === 0 && skipped === files.length) {
      process.exit(0);
    }
    if (failed > 0) {
      process.exit(2);
    }
    process.exit(0);
  });

program.parse();
