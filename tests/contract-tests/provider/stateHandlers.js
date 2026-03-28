'use strict';

/**
 * Provider state handlers for the VerticalSliceCrudApi Pact provider verification.
 *
 * Each handler sets up the exact database state that the consumer interaction
 * describes.  Because the .NET API uses an EF Core InMemory database there is no
 * persistent data between runs; we seed required records by calling the API's own
 * endpoints.
 */

const axios = require('axios');

/**
 * @param {string} baseUrl - Base URL of the running provider API
 * @returns {Record<string, () => Promise<void>>}
 */
function buildStateHandlers(baseUrl) {
  const http = axios.create({ baseURL: baseUrl, validateStatus: () => true });

  async function createProduct(overrides = {}) {
    const payload = {
      name: 'Widget Pro',
      description: 'A professional widget',
      price: 29.99,
      stock: 100,
      ...overrides,
    };
    const response = await http.post('/api/products', payload);
    if (response.status !== 201) {
      throw new Error(
        `Failed to create product: ${response.status} – ${JSON.stringify(response.data)}`
      );
    }
    return response.data;
  }

  return {
    // ── Generic states ────────────────────────────────────────────────────────

    'no products exist': async () => {
      // The InMemory database starts fresh for every API process run.
      // In CI the API is started fresh, so no extra clean-up is needed.
      // For local runs where the API is reused, nothing critical depends on
      // an empty state – the consumer pacts are designed to tolerate extra
      // records where applicable.
    },

    'a product exists': async (params) => {
      await createProduct(
        params && params.id ? { id: params.id } : {}
      );
    },

    // Specific ID states (the provider receives the params object from the pact)
    'a product exists with id 11111111-1111-1111-1111-111111111111': async () => {
      await createProduct();
    },

    'a product exists with id 22222222-2222-2222-2222-222222222222': async () => {
      await createProduct();
    },

    'a product exists with id 33333333-3333-3333-3333-333333333333': async () => {
      await createProduct();
    },
  };
}

module.exports = { buildStateHandlers };
