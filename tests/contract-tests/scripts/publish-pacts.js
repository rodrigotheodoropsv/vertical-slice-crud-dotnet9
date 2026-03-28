'use strict';

/**
 * Publish Pact files to a Pact Broker.
 *
 * Usage:
 *   node scripts/publish-pacts.js
 *
 * Required environment variables (set in .env or CI secrets):
 *   PACT_BROKER_BASE_URL  – URL of the Pact Broker instance
 *   PACT_BROKER_TOKEN     – Bearer token (if authentication is enabled)
 *   APP_VERSION           – Consumer application version (e.g. git SHA)
 *
 * Optional:
 *   PACT_CONSUMER         – Consumer name (default: ProductsConsumer)
 *   PACT_PROVIDER         – Provider name (default: VerticalSliceCrudApi)
 *
 * The script reads every *.json file from the ../pacts/ directory and publishes
 * them to the configured broker.  It uses the Pact Broker HTTP API directly so
 * there is no additional CLI dependency required.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Configuration ─────────────────────────────────────────────────────────────

const BROKER_URL = process.env.PACT_BROKER_BASE_URL;
const BROKER_TOKEN = process.env.PACT_BROKER_TOKEN;
const APP_VERSION = process.env.APP_VERSION;
const CONSUMER = process.env.PACT_CONSUMER || 'ProductsConsumer';
const PACTS_DIR = path.join(__dirname, '..', 'pacts');

function validateConfig() {
  const missing = [];
  if (!BROKER_URL) missing.push('PACT_BROKER_BASE_URL');
  if (!APP_VERSION) missing.push('APP_VERSION');
  if (missing.length > 0) {
    console.error(`\nMissing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function request(method, url, body, headers = {}) {
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
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: raw }));
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Publish ───────────────────────────────────────────────────────────────────

async function publishPact(pactFilePath) {
  const pact = JSON.parse(fs.readFileSync(pactFilePath, 'utf-8'));
  const consumer = pact.consumer?.name || CONSUMER;
  const provider = pact.provider?.name;

  if (!provider) {
    console.warn(`  Skipping ${path.basename(pactFilePath)}: missing provider name`);
    return;
  }

  // PUT /pacts/provider/{provider}/consumer/{consumer}/version/{version}
  const url = `${BROKER_URL}/pacts/provider/${encodeURIComponent(provider)}/consumer/${encodeURIComponent(consumer)}/version/${encodeURIComponent(APP_VERSION)}`;

  console.log(`  Publishing: ${consumer} → ${provider} @ ${APP_VERSION}`);
  const result = await request('PUT', url, pact);

  if (result.status >= 200 && result.status < 300) {
    console.log(`  ✓ Published (HTTP ${result.status})`);
  } else {
    console.error(`  ✗ Failed (HTTP ${result.status}): ${result.body}`);
    process.exitCode = 1;
  }
}

async function main() {
  validateConfig();

  const pactFiles = fs
    .readdirSync(PACTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(PACTS_DIR, f));

  if (pactFiles.length === 0) {
    console.warn('\nNo pact files found in', PACTS_DIR);
    console.warn('Run `npm run test:consumer` first to generate pact files.\n');
    process.exit(1);
  }

  console.log(`\nPublishing ${pactFiles.length} pact file(s) to ${BROKER_URL}\n`);

  for (const file of pactFiles) {
    await publishPact(file);
  }

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error('\nUnhandled error:', err.message);
  process.exit(1);
});
