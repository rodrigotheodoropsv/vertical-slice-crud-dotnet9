import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PROVIDER = process.env.PACT_PROVIDER || 'VerticalSliceCrudApi';
const OAS_CONSUMER = process.env.OAS_CONSUMER_NAME || 'OasConsumer';
const API_PORT = parseInt(process.env.API_PORT || '5055', 10);
const PACTS_DIR = path.join(__dirname, '..', 'pacts');

const cliArgs = process.argv.slice(2);
const oasFile = getCliArg(cliArgs, '--oas-file');
const oasUrl = getCliArg(cliArgs, '--oas-url') || `http://localhost:${API_PORT}/openapi/v1.json`;

type JsonMap = Record<string, any>;

type RequestObj = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
};

type ResponseObj = {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
  matchingRules?: JsonMap;
};

type PactInteraction = {
  description: string;
  providerStates: Array<{ name: string }>;
  request: RequestObj;
  response: ResponseObj;
};

function getCliArg(args: string[], flag: string): string | null {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
}

async function fetchOas(): Promise<JsonMap> {
  if (oasFile) {
    console.log(`📄 Reading OAS from file: ${oasFile}`);
    return JSON.parse(fs.readFileSync(path.resolve(oasFile), 'utf8'));
  }
  console.log(`🌐 Fetching OAS from: ${oasUrl}`);
  return fetchJson(oasUrl);
}

function fetchJson(url: string): Promise<JsonMap> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function resolveRef(oas: JsonMap, ref: string): any {
  const parts = ref.replace(/^#\//, '').split('/');
  let node: any = oas;
  for (const part of parts) {
    node = node[decodeURIComponent(part.replace(/~1/g, '/').replace(/~0/g, '~'))];
    if (node === undefined) throw new Error(`Cannot resolve $ref: ${ref}`);
  }
  return node;
}

function resolveSchema(oas: JsonMap, schema: any): any {
  if (!schema) return {};
  if (schema.$ref) return resolveSchema(oas, resolveRef(oas, schema.$ref));
  return schema;
}

function primaryType(schema: any): string | null {
  if (!schema.type) return null;
  return Array.isArray(schema.type)
    ? schema.type.find((t: string) => t !== 'null') || null
    : schema.type;
}

const EXAMPLE_UUID = 'e2490de5-5bd3-43d5-b7c4-526e33f71304';
const EXAMPLE_DATETIME = '2026-01-15T10:00:00.0000000Z';

function exampleFromSchema(oas: JsonMap, schema: any, fieldName = ''): any {
  schema = resolveSchema(oas, schema);
  if (!schema || Object.keys(schema).length === 0) return null;

  if (schema.example !== undefined) return schema.example;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];

  const type = primaryType(schema);

  switch (type) {
    case 'object': {
      if (!schema.properties) return {};
      const obj: JsonMap = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const resolved = resolveSchema(oas, propSchema);
        const isNullable = Array.isArray(resolved.type) && resolved.type.includes('null');
        obj[key] = isNullable ? null : exampleFromSchema(oas, resolved, key);
      }
      return obj;
    }
    case 'array': {
      const item = schema.items ? exampleFromSchema(oas, resolveSchema(oas, schema.items), fieldName) : {};
      return [item];
    }
    case 'string':
      if (schema.format === 'uuid') return EXAMPLE_UUID;
      if (schema.format === 'date-time') return EXAMPLE_DATETIME;
      if (schema.format === 'uri') return 'https://tools.ietf.org/html/rfc7231#section-6.5.1';
      if (fieldName === 'name') return 'Widget Pro';
      if (fieldName === 'description') return 'A professional widget';
      if (fieldName === 'title') return 'Validation Error';
      if (fieldName === 'detail') return 'Produto não encontrado';
      if (fieldName === 'type') return 'https://tools.ietf.org/html/rfc7231#section-6.5.1';
      return 'string';
    case 'integer':
      if (fieldName === 'status') return 400;
      if (fieldName === 'stock') return 100;
      if (fieldName === 'totalCount') return 1;
      return 1;
    case 'number':
      if (fieldName === 'price') return 29.99;
      return 29.99;
    case 'boolean':
      return true;
    default:
      return null;
  }
}

function buildMatchingRules(oas: JsonMap, schema: any, jsonPath = '$', rules: JsonMap = {}): JsonMap {
  schema = resolveSchema(oas, schema);
  if (!schema || Object.keys(schema).length === 0) return rules;

  const type = primaryType(schema);

  switch (type) {
    case 'object':
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          buildMatchingRules(oas, resolveSchema(oas, propSchema), `${jsonPath}.${key}`, rules);
        }
      }
      break;
    case 'array':
      rules[jsonPath] = {
        combine: 'AND',
        matchers: [{ match: 'type', min: schema.minItems ?? 0 }],
      };
      if (schema.items) {
        buildMatchingRules(oas, resolveSchema(oas, schema.items), `${jsonPath}[*]`, rules);
      }
      break;
    case 'string':
      if (schema.format === 'uuid') {
        rules[jsonPath] = {
          combine: 'AND',
          matchers: [{ match: 'regex', regex: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' }],
        };
      } else if (schema.format === 'date-time') {
        rules[jsonPath] = {
          combine: 'AND',
          matchers: [{ match: 'datetime', format: "yyyy-MM-dd'T'HH:mm:ss.SSSSSSS'Z'" }],
        };
      } else {
        rules[jsonPath] = { combine: 'AND', matchers: [{ match: 'type' }] };
      }
      break;
    case 'integer':
      rules[jsonPath] = { combine: 'AND', matchers: [{ match: 'integer' }] };
      break;
    case 'number':
      rules[jsonPath] = { combine: 'AND', matchers: [{ match: 'decimal' }] };
      break;
    case 'boolean':
      rules[jsonPath] = { combine: 'AND', matchers: [{ match: 'type' }] };
      break;
    default:
      break;
  }

  return rules;
}

function inferProviderState(_httpMethod: string, statusCode: number, pathTemplate: string): string {
  if (statusCode >= 400) return 'no products exist';
  if (statusCode === 204) return 'a product exists';
  if (statusCode === 201) return 'no products exist';
  if (pathTemplate.includes('{')) return 'a product exists';
  return 'a product exists';
}

function buildRequestBodyForStatus(oas: JsonMap, schema: any, statusCode: number): any {
  const valid = exampleFromSchema(oas, schema);
  if (statusCode < 400 || typeof valid !== 'object' || valid === null || Array.isArray(valid)) {
    return valid;
  }

  const invalid = { ...valid } as JsonMap;
  if (Object.prototype.hasOwnProperty.call(invalid, 'name')) invalid.name = '';
  if (Object.prototype.hasOwnProperty.call(invalid, 'price')) invalid.price = 0;
  if (Object.prototype.hasOwnProperty.call(invalid, 'stock')) invalid.stock = -1;

  if (JSON.stringify(invalid) === JSON.stringify(valid)) {
    const firstStringKey = Object.entries(invalid).find(([, v]) => typeof v === 'string')?.[0];
    if (firstStringKey) invalid[firstStringKey] = '';
  }

  return invalid;
}

function normalizeCollectionSuccessBody(body: any, httpMethod: string, pathTemplate: string, statusCode: number): any {
  if (httpMethod !== 'get' || statusCode !== 200 || pathTemplate.includes('{')) return body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;

  if (Array.isArray(body.items) && typeof body.totalCount === 'number') {
    return { ...body, items: [], totalCount: 0 };
  }

  return body;
}

function substitutePath(pathTemplate: string, operation: any, oas: JsonMap): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_m, paramName) => {
    const paramDef = (operation.parameters || []).find((p: any) => p.name === paramName && p.in === 'path');
    if (paramDef) {
      const schema = resolveSchema(oas, paramDef.schema || {});
      if (schema.format === 'uuid') return EXAMPLE_UUID;
    }
    return `example-${paramName}`;
  });
}

function buildInteractions(oas: JsonMap): PactInteraction[] {
  const interactions: PactInteraction[] = [];
  const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options']);

  for (const [pathTemplate, pathItem] of Object.entries(oas.paths || {})) {
    for (const [httpMethod, operation] of Object.entries(pathItem as JsonMap)) {
      if (!HTTP_METHODS.has(httpMethod)) continue;
      if (!operation || typeof operation !== 'object') continue;

      const operationId = (operation as JsonMap).operationId || `${httpMethod.toUpperCase()} ${pathTemplate}`;
      const pactPath = substitutePath(pathTemplate, operation, oas);

      for (const [statusCodeStr, responseSpec] of Object.entries((operation as JsonMap).responses || {})) {
        const statusCode = parseInt(statusCodeStr, 10);
        if (isNaN(statusCode)) continue;

        const requestObj: RequestObj = { method: httpMethod.toUpperCase(), path: pactPath };

        if ((operation as JsonMap).requestBody) {
          const content = (operation as JsonMap).requestBody?.content?.['application/json'];
          if (content?.schema) {
            const schema = resolveSchema(oas, content.schema);
            requestObj.headers = { 'Content-Type': 'application/json' };
            requestObj.body = buildRequestBodyForStatus(oas, schema, statusCode);
          }
        }

        const responseObj: ResponseObj = { status: statusCode };
        const matchingRules: JsonMap = {};

        const content = (responseSpec as JsonMap).content?.['application/json'];
        if (content?.schema) {
          const schema = resolveSchema(oas, content.schema);
          responseObj.headers = { 'Content-Type': 'application/json; charset=utf-8' };
          responseObj.body = normalizeCollectionSuccessBody(
            exampleFromSchema(oas, schema),
            httpMethod,
            pathTemplate,
            statusCode,
          );

          const bodyRules = buildMatchingRules(oas, schema);
          if (Object.keys(bodyRules).length > 0) matchingRules.body = bodyRules;
        }

        if (Object.keys(matchingRules).length > 0) {
          responseObj.matchingRules = matchingRules;
        }

        const providerState = inferProviderState(httpMethod, statusCode, pathTemplate);

        interactions.push({
          description: `${operationId} → ${statusCode}`,
          providerStates: [{ name: providerState }],
          request: requestObj,
          response: responseObj,
        });
      }
    }
  }

  return interactions;
}

async function main(): Promise<void> {
  const oas = await fetchOas();
  const interactions = buildInteractions(oas);

  const pact = {
    consumer: { name: OAS_CONSUMER },
    provider: { name: PROVIDER },
    interactions,
    metadata: {
      pactSpecification: { version: '3.0.0' },
      generatedBy: 'generate-provider-pact-from-oas',
      sourceOasVersion: oas.openapi || 'unknown',
      generatedAt: new Date().toISOString(),
    },
  };

  if (!fs.existsSync(PACTS_DIR)) fs.mkdirSync(PACTS_DIR, { recursive: true });

  const outputFile = path.join(PACTS_DIR, `${OAS_CONSUMER}-${PROVIDER}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(pact, null, 2));

  console.log(`\n✅ Pact written to: ${outputFile}`);
  console.log(`   Interactions generated: ${interactions.length}`);
  interactions.forEach((i) => console.log(`   • ${i.description}`));
}

main().catch((err: Error) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
