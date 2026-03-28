'use strict';

/**
 * OAS → Pact Provider Contract Generator
 *
 * Reads the OpenAPI 3.x specification from a running API (or a local JSON file)
 * and generates a Pact V3-compatible JSON contract.  Each operation + response-status
 * combination becomes one Pact interaction, with type-based matching rules derived
 * from the OAS schemas — so the provider can verify its own contract without any
 * hand-written consumer code.
 *
 * Usage:
 *   # From the running API (default: http://localhost:5055/openapi/v1.json)
 *   node scripts/generate-provider-pact-from-oas.js
 *
 *   # From a local OAS file
 *   node scripts/generate-provider-pact-from-oas.js --oas-file ./openapi.json
 *
 *   # From a custom URL
 *   node scripts/generate-provider-pact-from-oas.js --oas-url http://localhost:5055/openapi/v1.json
 *
 * Output:
 *   pacts/<OAS_CONSUMER_NAME>-<PACT_PROVIDER>.json
 *   (default: OasConsumer-VerticalSliceCrudApi.json)
 *
 * Environment variables (all optional, see .env.example):
 *   API_PORT          Port where the API is running (default: 5055)
 *   PACT_PROVIDER     Provider name written into the pact (default: VerticalSliceCrudApi)
 *   OAS_CONSUMER_NAME Synthetic consumer name for the generated pact (default: OasConsumer)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs    = require('fs');
const path  = require('path');
const http  = require('http');
const https = require('https');

// ── Configuration ─────────────────────────────────────────────────────────────

const PROVIDER         = process.env.PACT_PROVIDER      || 'VerticalSliceCrudApi';
const OAS_CONSUMER     = process.env.OAS_CONSUMER_NAME  || 'OasConsumer';
const API_PORT         = parseInt(process.env.API_PORT  || '5055', 10);
const PACTS_DIR        = path.join(__dirname, '..', 'pacts');

const cliArgs  = process.argv.slice(2);
const oasFile  = getCliArg(cliArgs, '--oas-file');
const oasUrl   = getCliArg(cliArgs, '--oas-url') || `http://localhost:${API_PORT}/openapi/v1.json`;

function getCliArg(args, flag) {
  const i = args.indexOf(flag);
  return (i !== -1 && i + 1 < args.length) ? args[i + 1] : null;
}

// ── OAS fetching ──────────────────────────────────────────────────────────────

async function fetchOas() {
  if (oasFile) {
    console.log(`📄 Reading OAS from file: ${oasFile}`);
    return JSON.parse(fs.readFileSync(path.resolve(oasFile), 'utf8'));
  }
  console.log(`🌐 Fetching OAS from: ${oasUrl}`);
  return fetchJson(oasUrl);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── $ref resolution ───────────────────────────────────────────────────────────

/**
 * Resolves a JSON Pointer ref (e.g. "#/components/schemas/Foo") within the OAS document.
 */
function resolveRef(oas, ref) {
  const parts = ref.replace(/^#\//, '').split('/');
  let node = oas;
  for (const part of parts) {
    node = node[decodeURIComponent(part.replace(/~1/g, '/').replace(/~0/g, '~'))];
    if (node === undefined) throw new Error(`Cannot resolve $ref: ${ref}`);
  }
  return node;
}

/**
 * Returns the schema object with all top-level $ref references resolved.
 * Does NOT recursively resolve nested $refs — that is done on demand.
 */
function resolveSchema(oas, schema) {
  if (!schema) return {};
  if (schema.$ref) return resolveSchema(oas, resolveRef(oas, schema.$ref));
  return schema;
}

// ── Non-null type extraction (handles OAS 3.1 nullable arrays) ───────────────

/**
 * Returns the primary (non-null) type from a schema.
 * OAS 3.1 represents nullable as `"type": ["string", "null"]`.
 */
function primaryType(schema) {
  if (!schema.type) return null;
  return Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') || null)
    : schema.type;
}

// ── Example value generation ──────────────────────────────────────────────────

const EXAMPLE_UUID     = 'e2490de5-5bd3-43d5-b7c4-526e33f71304';
const EXAMPLE_DATETIME = '2026-01-15T10:00:00.0000000Z';

/**
 * Derives a concrete example value from an OAS schema.
 * Used to populate the "body" section of each Pact interaction.
 */
function exampleFromSchema(oas, schema, fieldName = '') {
  schema = resolveSchema(oas, schema);
  if (!schema || Object.keys(schema).length === 0) return null;

  // Explicit example in the schema always wins
  if (schema.example !== undefined) return schema.example;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];

  const type = primaryType(schema);

  switch (type) {
    case 'object': {
      if (!schema.properties) return {};
      const obj = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const resolved = resolveSchema(oas, propSchema);
        const isNullable =
          Array.isArray(resolved.type) && resolved.type.includes('null');
        obj[key] = isNullable
          ? null
          : exampleFromSchema(oas, resolved, key);
      }
      return obj;
    }

    case 'array': {
      const item = schema.items ? exampleFromSchema(oas, resolveSchema(oas, schema.items), fieldName) : {};
      return [item];
    }

    case 'string':
      if (schema.format === 'uuid')      return EXAMPLE_UUID;
      if (schema.format === 'date-time') return EXAMPLE_DATETIME;
      if (schema.format === 'uri')       return 'https://tools.ietf.org/html/rfc7231#section-6.5.1';
      // Semantic field-name hints
      if (fieldName === 'name')          return 'Widget Pro';
      if (fieldName === 'description')   return 'A professional widget';
      if (fieldName === 'title')         return 'Validation Error';
      if (fieldName === 'detail')        return 'Produto não encontrado';
      if (fieldName === 'type')          return 'https://tools.ietf.org/html/rfc7231#section-6.5.1';
      return 'string';

    case 'integer':
      if (fieldName === 'status')        return 400;
      if (fieldName === 'stock')         return 100;
      if (fieldName === 'totalCount')    return 1;
      return 1;

    case 'number':
      if (fieldName === 'price')         return 29.99;
      return 29.99;

    case 'boolean':
      return true;

    default:
      return null;
  }
}

// ── Matching rule generation ──────────────────────────────────────────────────

/**
 * Recursively walks an OAS schema and builds a Pact V3 `matchingRules` object.
 * Rules are type-based so consumer interactions remain flexible to value changes.
 */
function buildMatchingRules(oas, schema, jsonPath = '$', rules = {}) {
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
      rules[jsonPath] = { combine: 'AND', matchers: [{ match: 'type', min: 1 }] };
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
      rules[jsonPath] = {
        combine: 'AND',
        matchers: [{ match: 'decimal' }],
      };
      break;

    case 'boolean':
      rules[jsonPath] = { combine: 'AND', matchers: [{ match: 'type' }] };
      break;

    default:
      break;
  }

  return rules;
}

// ── Provider-state inference ──────────────────────────────────────────────────

/**
 * Returns an appropriate provider-state description based on the HTTP method,
 * status code, and whether the path contains an ID parameter.
 */
function inferProviderState(httpMethod, statusCode, pathTemplate) {
  if (statusCode >= 400) return 'no products exist';
  if (statusCode === 204) return 'a product exists';             // DELETE success
  if (statusCode === 201) return 'no products exist';            // POST – nothing pre-exists
  // 200 OK
  if (pathTemplate.includes('{')) return 'a product exists';     // GET/PUT by ID
  return 'a product exists';                                     // GET all (non-empty)
}

// ── Path parameter substitution ───────────────────────────────────────────────

/**
 * Replaces OAS path parameter templates ({id}) with example values derived from
 * the parameter schema.
 */
function substitutePath(pathTemplate, operation, oas) {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, paramName) => {
    const paramDef = (operation.parameters || [])
      .find((p) => p.name === paramName && p.in === 'path');
    if (paramDef) {
      const schema = resolveSchema(oas, paramDef.schema || {});
      if (schema.format === 'uuid') return EXAMPLE_UUID;
    }
    return `example-${paramName}`;
  });
}

// ── Interaction builder ───────────────────────────────────────────────────────

/**
 * Iterates over every OAS path + method + response-status combination and
 * converts each into a Pact V3 interaction object.
 */
function buildInteractions(oas) {
  const interactions = [];
  const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options']);

  for (const [pathTemplate, pathItem] of Object.entries(oas.paths || {})) {
    for (const [httpMethod, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(httpMethod)) continue;
      if (!operation || typeof operation !== 'object') continue;

      const operationId = operation.operationId || `${httpMethod.toUpperCase()} ${pathTemplate}`;
      const pactPath    = substitutePath(pathTemplate, operation, oas);

      // ── Build the request object ─────────────────────────────────────────────
      const requestObj = { method: httpMethod.toUpperCase(), path: pactPath };

      if (operation.requestBody) {
        const content = operation.requestBody.content?.['application/json'];
        if (content?.schema) {
          const schema = resolveSchema(oas, content.schema);
          requestObj.headers = { 'Content-Type': 'application/json' };
          requestObj.body    = exampleFromSchema(oas, schema);
        }
      }

      // ── One interaction per response status ──────────────────────────────────
      for (const [statusCodeStr, responseSpec] of Object.entries(operation.responses || {})) {
        const statusCode = parseInt(statusCodeStr, 10);
        if (isNaN(statusCode)) continue;           // skip "default" or non-numeric keys

        const responseObj    = { status: statusCode };
        const matchingRules  = {};

        const content = responseSpec.content?.['application/json'];
        if (content?.schema) {
          const schema = resolveSchema(oas, content.schema);
          responseObj.headers = { 'Content-Type': 'application/json; charset=utf-8' };
          responseObj.body    = exampleFromSchema(oas, schema);

          const bodyRules = buildMatchingRules(oas, schema);
          if (Object.keys(bodyRules).length > 0) {
            matchingRules.body = bodyRules;
          }
        }

        if (Object.keys(matchingRules).length > 0) {
          responseObj.matchingRules = matchingRules;
        }

        const providerState = inferProviderState(httpMethod, statusCode, pathTemplate);

        interactions.push({
          description:    `${operationId} → ${statusCode}`,
          providerStates: [{ name: providerState }],
          request:        requestObj,
          response:       responseObj,
        });
      }
    }
  }

  return interactions;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const oas = await fetchOas();

  const interactions = buildInteractions(oas);

  const pact = {
    consumer:     { name: OAS_CONSUMER },
    provider:     { name: PROVIDER },
    interactions,
    metadata: {
      pactSpecification: { version: '3.0.0' },
      generatedBy:       'generate-provider-pact-from-oas',
      sourceOasVersion:  oas.openapi || 'unknown',
      generatedAt:       new Date().toISOString(),
    },
  };

  if (!fs.existsSync(PACTS_DIR)) fs.mkdirSync(PACTS_DIR, { recursive: true });

  const outputFile = path.join(PACTS_DIR, `${OAS_CONSUMER}-${PROVIDER}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(pact, null, 2));

  console.log(`\n✅ Pact written to: ${outputFile}`);
  console.log(`   Interactions generated: ${interactions.length}`);
  interactions.forEach((i) => console.log(`   • ${i.description}`));
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
