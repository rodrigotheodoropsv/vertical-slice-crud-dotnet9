import axios from 'axios';

/**
 * Provider state handlers for the VerticalSliceCrudApi Pact provider verification.
 *
 * Each handler sets up the exact database state that the consumer interaction
 * describes. Because the .NET API uses an EF Core InMemory database there is no
 * persistent data between runs; we seed required records by calling the API's own
 * endpoints.
 */
export function buildStateHandlers(baseUrl: string): Record<string, (params?: { id?: string }) => Promise<void>> {
  const http = axios.create({ baseURL: baseUrl, validateStatus: () => true });

  async function createProduct(overrides: Record<string, unknown> = {}) {
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
        `Failed to create product: ${response.status} – ${JSON.stringify(response.data)}`,
      );
    }
    return response.data;
  }

  return {
    'no products exist': async () => {
      // InMemory DB starts fresh when API process starts; no explicit cleanup needed.
    },

    'a product exists': async (params?: { id?: string }) => {
      await createProduct(params?.id ? { id: params.id } : {});
    },

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
