import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess: ChildProcess | null = null;

async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('http://127.0.0.1:8080/health');
    return res.ok;
  } catch {
    return false;
  }
}

export async function setup() {
  const isAlreadyRunning = await checkHealth();
  if (isAlreadyRunning) {
    console.log('\n[Test Global Setup] Fastify backend server is already running on port 8080.');
    return;
  }

  console.log('\n[Test Global Setup] Starting Fastify backend server on port 8080 for test suite...');

  const distPath = path.resolve(__dirname, '../dist/index.js');
  const srcPath = path.resolve(__dirname, '../src/index.ts');

  const useDist = fs.existsSync(distPath);
  const runner = useDist ? 'node' : (process.platform === 'win32' ? 'npx.cmd' : 'npx');
  const args = useDist ? [distPath] : ['tsx', srcPath];

  let startupLogs = '';
  serverProcess = spawn(runner, args, {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: '8080',
      HOST: '0.0.0.0',
      NODE_ENV: 'test'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout?.on('data', (d) => {
    startupLogs += d.toString();
  });
  serverProcess.stderr?.on('data', (d) => {
    startupLogs += d.toString();
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    if (await checkHealth()) {
      console.log('[Test Global Setup] Fastify backend server is ready!');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`[Test Global Setup] Timed out waiting for Fastify backend server to start. Server logs:\n${startupLogs}`);
}

export async function teardown() {
  if (serverProcess) {
    console.log('\n[Test Global Teardown] Shutting down Fastify test server...');
    if (process.platform === 'win32' && serverProcess.pid) {
      try {
        spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
      } catch {}
    } else {
      serverProcess.kill('SIGTERM');
    }
    serverProcess = null;
  }
}
