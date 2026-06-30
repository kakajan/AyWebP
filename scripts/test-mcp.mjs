import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'bin', 'aywebp-mcp.js');
const projectRoot = path.join(__dirname, '..');

/**
 * @param {import('node:child_process').ChildProcessWithoutNullStreams} proc
 * @param {unknown} message
 */
function send(proc, message) {
  proc.stdin.write(`${JSON.stringify(message)}\n`);
}

/**
 * @param {import('node:child_process').ChildProcessWithoutNullStreams} proc
 * @returns {Promise<unknown>}
 */
function readMessage(proc) {
  const rl = readline.createInterface({ input: proc.stdout });
  return new Promise((resolve, reject) => {
    rl.once('line', (line) => {
      rl.close();
      resolve(JSON.parse(line));
    });
    proc.once('error', reject);
  });
}

const proc = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    AYWEBP_ALLOWED_ROOTS: projectRoot,
  },
});

proc.stderr.on('data', (chunk) => {
  console.error('[stderr]', chunk.toString().trim());
});

send(proc, {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'aywebp-test', version: '1.0.0' },
  },
});

const initResponse = await readMessage(proc);
console.log('initialize:', initResponse.result?.serverInfo?.name, initResponse.result?.serverInfo?.version);

send(proc, {
  jsonrpc: '2.0',
  method: 'notifications/initialized',
});

send(proc, {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {},
});

const toolsResponse = await readMessage(proc);
const toolNames = toolsResponse.result?.tools?.map((tool) => tool.name) ?? [];
console.log('tools:', toolNames.join(', '));

send(proc, {
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'get_version',
    arguments: {},
  },
});

const versionResponse = await readMessage(proc);
console.log('get_version:', versionResponse.result?.content?.[0]?.text?.split('\n')[1]);

const testImage = path.join(projectRoot, 'test-fixtures', 'resize-test', 'w200h100.png');

send(proc, {
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: {
    name: 'inspect_image',
    arguments: { path: testImage },
  },
});

const inspectResponse = await readMessage(proc);
const inspectJson = JSON.parse(inspectResponse.result?.content?.[0]?.text ?? '{}');
console.log('inspect_image:', inspectJson.width, 'x', inspectJson.height, inspectJson.format);

send(proc, {
  jsonrpc: '2.0',
  id: 5,
  method: 'tools/call',
  params: {
    name: 'convert_images',
    arguments: {
      path: testImage,
      force: true,
      width: 100,
    },
  },
});

const convertResponse = await readMessage(proc);
const convertJson = JSON.parse(convertResponse.result?.content?.[0]?.text ?? '{}');
console.log('convert_images:', convertJson.converted, 'converted,', convertJson.failed, 'failed');

proc.kill();
console.log('MCP smoke test passed');
