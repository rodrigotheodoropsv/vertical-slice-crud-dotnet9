'use strict';

/**
 * Provider Contract Verification — VerticalSliceCrudApi
 *
 * This test uses @pact-foundation/pact's Verifier to replay all consumer
 * interactions captured in the .pact files against the real .NET API and
 * confirm that the provider honours every contract.
 *
 * Prerequisites:
 *   1. Build the .NET API:
 *        dotnet build ../../src/VerticalSliceCrud.Api
 *   2. Start the .NET API on the port configured in .env (default 5055):
 *        dotnet run --project ../../src/VerticalSliceCrud.Api --no-build
 *   3. Run the consumer tests first to produce the pact files:
 *        npm run test:consumer
 *   4. Then run the provider tests:
 *        npm run test:provider
 *
 * In CI, steps 1-3 are handled by the workflow before calling this suite.
 * The API uses EF Core InMemory, so no Docker or external database is needed.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const { Verifier } = require('@pact-foundation/pact');
const { buildStateHandlers } = require('./stateHandlers');

const PROVIDER = process.env.PACT_PROVIDER || 'VerticalSliceCrudApi';
const API_PORT = parseInt(process.env.API_PORT || '5055', 10);
const PROVIDER_BASE_URL = `http://localhost:${API_PORT}`;
const PACTS_DIR = path.join(__dirname, '..', 'pacts');

// Pact Broker (optional – only used when PACT_BROKER_BASE_URL is set)
const BROKER_URL = process.env.PACT_BROKER_BASE_URL;
const BROKER_TOKEN = process.env.PACT_BROKER_TOKEN;
const APP_VERSION = process.env.APP_VERSION || 'local';
const CONSUMER = process.env.PACT_CONSUMER || 'ProductsConsumer';

describe('VerticalSliceCrudApi — Provider Verification', () => {
  it('honours all consumer pact contracts', async () => {
    // Build the options object dynamically so we can switch between local pact
    // files and Pact Broker without changing the test code.
    const verifierOpts = {
      provider: PROVIDER,
      providerBaseUrl: PROVIDER_BASE_URL,
      logLevel: 'warn',

      // State handlers seed the InMemory database via the API's own endpoints
      stateHandlers: buildStateHandlers(PROVIDER_BASE_URL),

      // Provider version published alongside pact verification results
      providerVersion: APP_VERSION,
    };

    if (BROKER_URL) {
      // Verify all pacts for this provider stored in the Pact Broker
      Object.assign(verifierOpts, {
        pactBrokerUrl: BROKER_URL,
        ...(BROKER_TOKEN ? { pactBrokerToken: BROKER_TOKEN } : {}),
        consumerVersionSelectors: [{ mainBranch: true }, { deployedOrReleased: true }],
        publishVerificationResult: true,
      });
    } else {
      // Verify pact files from the local pacts/ directory
      verifierOpts.pactUrls = [
        path.join(PACTS_DIR, `${CONSUMER}-${PROVIDER}.json`),
      ];
    }

    const verifier = new Verifier(verifierOpts);
    await verifier.verifyProvider();
  }, 120_000);
});
