import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BROKER_URL = process.env.PACT_BROKER_BASE_URL;
const BROKER_TOKEN = process.env.PACT_BROKER_TOKEN;
const APP_VERSION = process.env.APP_VERSION;
const CONSUMER = process.env.PACT_CONSUMER || 'ProductsConsumer';
const PACTS_DIR = path.join(__dirname, '..', 'pacts');

function validateConfig(): void {
  const missing: string[] = [];
  if (!BROKER_URL) missing.push('PACT_BROKER_BASE_URL');
  if (!APP_VERSION) missing.push('APP_VERSION');
  if (missing.length > 0) {
    console.error(`\nMissing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }
}

function request(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status?: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : undefined;

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(BROKER_TOKEN ? { Authorization: `Bearer ${BROKER_TOKEN}` } : {}),
          ...(data ? { 'Content-Length': String(Buffer.byteLength(data)) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: raw }));
      },
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function publishPact(pactFilePath: string): Promise<void> {
  const pact = JSON.parse(fs.readFileSync(pactFilePath, 'utf-8')) as {
    consumer?: { name?: string };
    provider?: { name?: string };
  };
  const consumer = pact.consumer?.name || CONSUMER;
  const provider = pact.provider?.name;

  if (!provider) {
    console.warn(`  Skipping ${path.basename(pactFilePath)}: missing provider name`);
    return;
  }

  const url = `${BROKER_URL}/pacts/provider/${encodeURIComponent(provider)}/consumer/${encodeURIComponent(consumer)}/version/${encodeURIComponent(APP_VERSION as string)}`;

  console.log(`  Publishing: ${consumer} → ${provider} @ ${APP_VERSION}`);
  const result = await request('PUT', url, pact);

  if ((result.status ?? 500) >= 200 && (result.status ?? 500) < 300) {
    console.log(`  ✓ Published (HTTP ${result.status})`);
  } else {
    console.error(`  ✗ Failed (HTTP ${result.status}): ${result.body}`);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  validateConfig();

  const pactFiles = fs
    .readdirSync(PACTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(PACTS_DIR, f));

  if (pactFiles.length === 0) {
    console.warn('\nNo pact files found in', PACTS_DIR);
    console.warn('Generate pacts before publishing.\n');
    process.exit(1);
  }

  console.log(`\nPublishing ${pactFiles.length} pact file(s) to ${BROKER_URL}\n`);

  for (const file of pactFiles) {
    await publishPact(file);
  }

  console.log('\nDone.\n');
}

main().catch((err: Error) => {
  console.error('\nUnhandled error:', err.message);
  process.exit(1);
});
