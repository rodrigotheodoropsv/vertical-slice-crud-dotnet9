import dotenv from 'dotenv';
import path from 'node:path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import pactum from 'pactum';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { like, eachLike, integer, decimal, datetime, uuid } = MatchersV3;

const DT_EXAMPLE = '2026-01-15T10:00:00.0000000Z';
const DT_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSS'Z'";

const CONSUMER = process.env.PACT_CONSUMER || 'ProductsConsumer';
const PROVIDER = process.env.PACT_PROVIDER || 'VerticalSliceCrudApi';
const MOCK_PORT = parseInt(process.env.PACT_MOCK_PORT || '4000', 10);
const PACTS_DIR = path.join(__dirname, '..', 'pacts');

const PRODUCT_CREATED = {
  id: uuid(),
  name: like('Widget Pro'),
  description: like('A professional widget'),
  price: decimal(29.99),
  stock: integer(100),
  createdAt: datetime(DT_FORMAT, DT_EXAMPLE),
};

const PRODUCT_DETAIL = {
  id: like('11111111-1111-1111-1111-111111111111'),
  name: like('Widget Pro'),
  description: like('A professional widget'),
  price: decimal(29.99),
  stock: integer(100),
  createdAt: datetime(DT_FORMAT, DT_EXAMPLE),
  updatedAt: datetime(DT_FORMAT, DT_EXAMPLE),
};

const PRODUCT_LIST = {
  items: eachLike({ id: uuid(), name: like('Widget Pro'), price: decimal(29.99), stock: integer(100) }),
  totalCount: integer(1),
};

const ERROR_400 = {
  type: like('https://tools.ietf.org/html/rfc7231#section-6.5.1'),
  title: like('Validation Error'),
  status: integer(400),
  detail: like("'Name' must not be empty."),
};

describe('Products API — Consumer Contract Tests', () => {
  it('honours all consumer expectations (all interactions verified in one session)', () => {
    const provider = new PactV3({
      consumer: CONSUMER,
      provider: PROVIDER,
      port: MOCK_PORT,
      dir: PACTS_DIR,
      logLevel: 'warn',
    });

    const EXISTING_ID = '11111111-1111-1111-1111-111111111111';
    const UPDATE_ID = '22222222-2222-2222-2222-222222222222';
    const DELETE_ID = '33333333-3333-3333-3333-333333333333';
    const MISSING_ID = '00000000-0000-0000-0000-000000000000';

    return provider
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to create a product',
        withRequest: {
          method: 'POST', path: '/api/products',
          headers: { 'Content-Type': 'application/json' },
          body: { name: 'Widget Pro', description: 'A professional widget', price: 29.99, stock: 100 },
        },
        willRespondWith: {
          status: 201,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: PRODUCT_CREATED,
        },
      })
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to create a product with an empty name',
        withRequest: {
          method: 'POST', path: '/api/products',
          headers: { 'Content-Type': 'application/json' },
          body: { name: '', description: 'desc', price: 5.0, stock: 1 },
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: ERROR_400,
        },
      })
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to list all products when catalogue is empty',
        withRequest: { method: 'GET', path: '/api/products' },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: { items: [], totalCount: integer(0) },
        },
      })
      .addInteraction({
        states: [{ description: 'a product exists' }],
        uponReceiving: 'a request to list all products',
        withRequest: { method: 'GET', path: '/api/products' },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: PRODUCT_LIST,
        },
      })
      .addInteraction({
        states: [{ description: 'a product exists' }],
        uponReceiving: 'a request to get a product by ID',
        withRequest: { method: 'GET', path: `/api/products/${EXISTING_ID}` },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: PRODUCT_DETAIL,
        },
      })
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to get a non-existent product',
        withRequest: { method: 'GET', path: `/api/products/${MISSING_ID}` },
        willRespondWith: {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: { status: integer(404), title: like('Not Found') },
        },
      })
      .addInteraction({
        states: [{ description: 'a product exists' }],
        uponReceiving: 'a request to update an existing product',
        withRequest: {
          method: 'PUT', path: `/api/products/${UPDATE_ID}`,
          headers: { 'Content-Type': 'application/json' },
          body: { name: 'Updated Widget', description: 'Updated description', price: 49.99, stock: 200 },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: {
            id: like(UPDATE_ID),
            name: like('Updated Widget'),
            description: like('Updated description'),
            price: decimal(49.99),
            stock: integer(200),
            updatedAt: datetime(DT_FORMAT, DT_EXAMPLE),
          },
        },
      })
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to update a non-existent product',
        withRequest: {
          method: 'PUT', path: `/api/products/${MISSING_ID}`,
          headers: { 'Content-Type': 'application/json' },
          body: { name: 'Name', description: 'Desc', price: 1.0, stock: 1 },
        },
        willRespondWith: {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: { status: integer(404), title: like('Not Found') },
        },
      })
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to update a product with invalid data',
        withRequest: {
          method: 'PUT', path: `/api/products/${MISSING_ID}`,
          headers: { 'Content-Type': 'application/json' },
          body: { name: '', description: 'Desc', price: 1.0, stock: 1 },
        },
        willRespondWith: {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: ERROR_400,
        },
      })
      .addInteraction({
        states: [{ description: 'a product exists' }],
        uponReceiving: 'a request to delete an existing product',
        withRequest: { method: 'DELETE', path: `/api/products/${DELETE_ID}` },
        willRespondWith: { status: 204 },
      })
      .addInteraction({
        states: [{ description: 'no products exist' }],
        uponReceiving: 'a request to delete a non-existent product',
        withRequest: { method: 'DELETE', path: `/api/products/${MISSING_ID}` },
        willRespondWith: {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: { status: integer(404), title: like('Not Found') },
        },
      })
      .executeTest(async (mockServer: { url: string }) => {
        const base = mockServer.url;

        const create201 = await pactum.spec()
          .post(`${base}/api/products`)
          .withJson({ name: 'Widget Pro', description: 'A professional widget', price: 29.99, stock: 100 })
          .toss();
        expect(create201.statusCode).toBe(201);

        const create400 = await pactum.spec()
          .post(`${base}/api/products`)
          .withJson({ name: '', description: 'desc', price: 5.0, stock: 1 })
          .toss();
        expect(create400.statusCode).toBe(400);

        const list200Empty = await pactum.spec().get(`${base}/api/products`).toss();
        expect(list200Empty.statusCode).toBe(200);

        const list200WithItems = await pactum.spec().get(`${base}/api/products`).toss();
        expect(list200WithItems.statusCode).toBe(200);

        const getById200 = await pactum.spec().get(`${base}/api/products/${EXISTING_ID}`).toss();
        expect(getById200.statusCode).toBe(200);

        const getById404 = await pactum.spec().get(`${base}/api/products/${MISSING_ID}`).toss();
        expect(getById404.statusCode).toBe(404);

        const update200 = await pactum.spec()
          .put(`${base}/api/products/${UPDATE_ID}`)
          .withJson({ name: 'Updated Widget', description: 'Updated description', price: 49.99, stock: 200 })
          .toss();
        expect(update200.statusCode).toBe(200);

        const update404 = await pactum.spec()
          .put(`${base}/api/products/${MISSING_ID}`)
          .withJson({ name: 'Name', description: 'Desc', price: 1.0, stock: 1 })
          .toss();
        expect(update404.statusCode).toBe(404);

        const update400 = await pactum.spec()
          .put(`${base}/api/products/${MISSING_ID}`)
          .withJson({ name: '', description: 'Desc', price: 1.0, stock: 1 })
          .toss();
        expect(update400.statusCode).toBe(400);

        const delete204 = await pactum.spec().delete(`${base}/api/products/${DELETE_ID}`).toss();
        expect(delete204.statusCode).toBe(204);

        const delete404 = await pactum.spec().delete(`${base}/api/products/${MISSING_ID}`).toss();
        expect(delete404.statusCode).toBe(404);
      });
  });
});
