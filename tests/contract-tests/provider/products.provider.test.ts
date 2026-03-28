import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Verifier } from '@pact-foundation/pact';
import { buildStateHandlers } from './stateHandlers';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PROVIDER = (process.env.PACT_PROVIDER || 'VerticalSliceCrudApi').trim().replace(/^['\"]|['\"]$/g, '');
const API_PORT = parseInt(process.env.API_PORT || '5055', 10);
const PROVIDER_BASE_URL = `http://localhost:${API_PORT}`;
const PACTS_DIR = path.join(__dirname, '..', 'pacts');

const BROKER_URL = process.env.PACT_BROKER_BASE_URL;
const BROKER_TOKEN = process.env.PACT_BROKER_TOKEN;
const APP_VERSION = process.env.APP_VERSION || 'local';
const CONSUMER = (process.env.PACT_CONSUMER || 'ProductsConsumer').trim().replace(/^['\"]|['\"]$/g, '');
const CONSUMERS = process.env.PACT_CONSUMERS;

function readPactSafe(filePath: string): { consumer?: { name?: string }; provider?: { name?: string } } | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim();
    if (!raw) return null;
    return JSON.parse(raw) as { consumer?: { name?: string }; provider?: { name?: string } };
  } catch {
    return null;
  }
}

function resolveLocalPactUrls(): string[] {
  const pactFiles = fs
    .readdirSync(PACTS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .map((f) => path.join(PACTS_DIR, f));

  const pactsForProvider = pactFiles.filter((filePath) => {
    const pact = readPactSafe(filePath);
    return (pact?.provider?.name || '').trim() === PROVIDER;
  });

  if (CONSUMERS) {
    const consumerSet = new Set(
      CONSUMERS
        .split(',')
        .map((c) => c.trim().replace(/^['\"]|['\"]$/g, ''))
        .filter(Boolean),
    );

    return pactsForProvider.filter((filePath) => {
      const pact = readPactSafe(filePath);
      return consumerSet.has((pact?.consumer?.name || '').trim());
    });
  }

  if (process.env.PACT_CONSUMER) {
    return pactsForProvider.filter((filePath) => {
      const pact = readPactSafe(filePath);
      return (pact?.consumer?.name || '').trim() === CONSUMER;
    });
  }

  return pactsForProvider;
}

describe('VerticalSliceCrudApi — Provider Verification', () => {
  it('honours all consumer pact contracts', async () => {
    const verifierOpts: Record<string, unknown> = {
      provider: PROVIDER,
      providerBaseUrl: PROVIDER_BASE_URL,
      logLevel: 'warn',
      stateHandlers: buildStateHandlers(PROVIDER_BASE_URL),
      providerVersion: APP_VERSION,
    };

    if (BROKER_URL) {
      Object.assign(verifierOpts, {
        pactBrokerUrl: BROKER_URL,
        ...(BROKER_TOKEN ? { pactBrokerToken: BROKER_TOKEN } : {}),
        consumerVersionSelectors: [{ mainBranch: true }, { deployedOrReleased: true }],
        publishVerificationResult: true,
      });
    } else {
      const localPacts = resolveLocalPactUrls();

      if (localPacts.length === 0) {
        throw new Error(`No local pact files found in ${PACTS_DIR} for provider ${PROVIDER}.`);
      }

      const missing = localPacts.filter((p) => !fs.existsSync(p));
      if (missing.length > 0) {
        throw new Error(`Missing pact files: ${missing.join(', ')}`);
      }

      verifierOpts.pactUrls = localPacts.map((p) => pathToFileURL(p).href);
    }

    const verifier = new Verifier(verifierOpts);
    await verifier.verifyProvider();
  }, 120_000);
});
