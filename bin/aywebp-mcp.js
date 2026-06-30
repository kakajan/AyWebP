#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runConversion } from '../src/run-conversion.js';
import { inspectImage } from '../src/inspect.js';
import { SUPPORTED_EXTENSIONS } from '../src/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
);

/**
 * @param {unknown} data
 */
function jsonResult(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * @param {unknown} error
 */
function errorResult(error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message }, null, 2),
      },
    ],
    isError: true,
  };
}

const conversionInputSchema = {
  path: z.string().describe('Image file or directory path'),
  recursive: z.boolean().optional().describe('Scan subdirectories'),
  quality: z.number().int().min(1).max(100).optional().describe('WebP quality (1-100)'),
  force: z.boolean().optional().describe('Overwrite existing .webp files'),
  deleteSource: z.boolean().optional().describe('Delete source after successful conversion'),
  width: z.number().int().positive().optional().describe('Resize width in pixels'),
  height: z.number().int().positive().optional().describe('Resize height in pixels'),
  fit: z
    .enum(['inside', 'cover', 'fill', 'outside'])
    .optional()
    .describe('Fit mode when both width and height are set'),
  enlarge: z.boolean().optional().describe('Allow upscaling smaller images'),
};

const server = new McpServer({
  name: 'aywebp',
  version: pkg.version,
});

server.registerTool(
  'convert_images',
  {
    description: 'Convert image file(s) to WebP beside the source files',
    inputSchema: conversionInputSchema,
  },
  async (args) => {
    try {
      const result = await runConversion(args.path, {
        recursive: args.recursive ?? false,
        quality: args.quality,
        force: args.force ?? false,
        deleteSource: args.deleteSource ?? false,
        width: args.width,
        height: args.height,
        fit: args.fit,
        enlarge: args.enlarge ?? false,
        silent: true,
        validatePath: true,
      });
      return jsonResult(result);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  'inspect_image',
  {
    description: 'Inspect image metadata (format, dimensions, size) before converting',
    inputSchema: {
      path: z.string().describe('Path to a single image file'),
    },
  },
  async ({ path: imagePath }) => {
    try {
      const result = await inspectImage(imagePath, { validatePath: true });
      return jsonResult(result);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  'list_convertible',
  {
    description: 'Dry-run: list images that would be converted or skipped',
    inputSchema: conversionInputSchema,
  },
  async (args) => {
    try {
      const result = await runConversion(args.path, {
        recursive: args.recursive ?? false,
        quality: args.quality,
        force: args.force ?? false,
        width: args.width,
        height: args.height,
        fit: args.fit,
        enlarge: args.enlarge ?? false,
        dryRun: true,
        validatePath: true,
      });
      return jsonResult(result);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  'get_version',
  {
    description: 'Get aywebp version and supported input formats',
  },
  async () => {
    return jsonResult({
      name: pkg.name,
      version: pkg.version,
      supportedExtensions: [...SUPPORTED_EXTENSIONS],
    });
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
