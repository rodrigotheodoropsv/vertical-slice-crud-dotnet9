# Vertical Slice CRUD API — .NET 9

API CRUD completa construída com **Vertical Slice Architecture** em .NET 9, banco em memória (EF Core InMemory), documentação **OAS 3.1** via `Microsoft.AspNetCore.OpenApi` + `Scalar`, e suíte completa de testes de integração e contrato com **Pact** (consumer + provider) e **PactumJS** como cliente HTTP.

---

## Índice

1. [Stack Tecnológica](#-stack-tecnológica)
2. [Estrutura do Projeto](#-estrutura-do-projeto)
3. [Arquitetura — Vertical Slice](#-arquitetura--vertical-slice)
4. [Padrões Aplicados](#-padrões-aplicados)
5. [Como Executar a API](#-como-executar-a-api)
6. [Endpoints e Contratos HTTP](#-endpoints-e-contratos-http)
7. [Documentação OAS / Scalar](#-documentação-oas--scalar)
8. [Testes de Integração (.NET)](#-testes-de-integração-net)
9. [Testes de Contrato — Consumer (PactumJS + Pact)](#-testes-de-contrato--consumer-pactumjs--pact)
10. [Testes de Contrato — Provider (Pact Verifier)](#-testes-de-contrato--provider-pact-verifier)
11. [Gravação de Contratos via C# (PactRecorder)](#-gravação-de-contratos-via-c-pactrecorder)
12. [Geração de Contrato a partir do OAS](#-geração-de-contrato-a-partir-do-oas)
13. [Publicação no Pact Broker](#-publicação-no-pact-broker)
14. [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## ✨ Stack Tecnológica

| Camada                  | Tecnologia                                        |
|-------------------------|---------------------------------------------------|
| Framework               | .NET 9 / ASP.NET Core Minimal APIs               |
| Persistência            | EF Core 9 InMemory                               |
| Documentação OAS        | `Microsoft.AspNetCore.OpenApi` + Scalar 2.x      |
| Validação               | FluentValidation 11                               |
| Arquitetura             | Vertical Slice (sem MediatR)                      |
| Testes de integração    | xUnit + `Microsoft.AspNetCore.Mvc.Testing`        |
| Testes de contrato (JS) | `@pact-foundation/pact` 16 + **PactumJS** 3       |
| Runner de testes JS     | Jest 29                                           |

---

## 🗂️ Estrutura do Projeto

```
vertical-slice-crud-dotnet9/
├── src/
│   └── VerticalSliceCrud.Api/
│       ├── Common/
│       │   ├── Errors/        → ApiError (RFC 7807)
│       │   └── Results/       → Result<T> (sem exceções de domínio)
│       ├── Features/
│       │   └── Products/
│       │       ├── Models/          → Entidade Product
│       │       ├── CreateProduct/   → Request · Response · Validator · Handler · Endpoint
│       │       ├── GetProductById/  → Response · Handler · Endpoint
│       │       ├── GetAllProducts/  → Response · Handler · Endpoint
│       │       ├── UpdateProduct/   → Request · Response · Validator · Handler · Endpoint
│       │       └── DeleteProduct/   → Handler · Endpoint
│       └── Infrastructure/
│           └── Persistence/   → AppDbContext (EF Core)
│
└── tests/
    ├── VerticalSliceCrud.IntegrationTests/
    │   ├── Fixtures/          → ApiWebApplicationFactory
    │   ├── Products/          → Testes de integração por feature
    │   └── PactRecording/     → Gravação de contratos Pact via C#
    └── contract-tests/        → Testes de contrato em JavaScript
        ├── consumer/          → Teste consumer com PactumJS + Pact mock server
        ├── provider/          → Verificação provider com Pact Verifier
        ├── pacts/             → Arquivos .json de contrato gerados
        └── scripts/           → Publicação no Broker e geração via OAS
```

---

## 🏗️ Arquitetura — Vertical Slice

A Vertical Slice Architecture organiza o código por **funcionalidade** em vez de por camada técnica.  
Cada slice contém tudo que precisa para funcionar de forma autossuficiente — nenhum arquivo de uma feature depende de outra feature:

```
CreateProduct/
├── CreateProductRequest.cs   ← DTO de entrada
├── CreateProductValidator.cs ← Regras FluentValidation
├── CreateProductHandler.cs   ← Lógica de negócio + acesso ao banco
├── CreateProductResponse.cs  ← DTO de saída
└── CreateProductEndpoint.cs  ← Mapeamento da rota Minimal API
```

Vantagens desta abordagem:
- **Coesão total**: tudo sobre "criar produto" está numa pasta só.
- **Baixo acoplamento**: adicionar ou remover um slice não afeta os outros.
- **Escalabilidade de equipe**: times diferentes podem trabalhar em slices diferentes sem conflito.

---

## 📐 Padrões Aplicados

### `Result<T>` — sem exceções para fluxo de negócio

Os handlers retornam `Result<T>` em vez de lançar exceções para casos esperados (validação, não encontrado):

```csharp
// Sucesso
return Result.Success(new CreateProductResponse(...));

// Falha de negócio
return Result.Failure<CreateProductResponse>("Nome é obrigatório.");
```

O endpoint decide o status HTTP baseado em `result.IsSuccess`.

### `ApiError` — RFC 7807 (Problem Details)

Todos os erros da API seguem o padrão [RFC 7807](https://tools.ietf.org/html/rfc7807):

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Error",
  "status": 400,
  "detail": "Nome é obrigatório."
}
```

### FluentValidation

Regras de validação declarativas, separadas do handler:

| Campo    | Regra                                          |
|----------|------------------------------------------------|
| `Name`   | Obrigatório, máximo 200 caracteres             |
| `Price`  | Maior que zero                                 |
| `Stock`  | Maior ou igual a zero                          |

---

## 🚀 Como Executar a API

```bash
cd src/VerticalSliceCrud.Api
dotnet run
```

A API sobe em `http://localhost:5055` (perfil `http`) com banco em memória.  
O banco é reiniciado a cada execução.

---

## 📡 Endpoints e Contratos HTTP

### `POST /api/products` — Criar produto

**Request body:**
```json
{
  "name": "Widget Pro",
  "description": "A professional widget",
  "price": 29.99,
  "stock": 100
}
```

**Respostas:**

| Status | Descrição                        |
|--------|----------------------------------|
| `201`  | Produto criado; `Location` header aponta para `/api/products/{id}` |
| `400`  | Dados inválidos (`ApiError`)     |

**Response body (201):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Widget Pro",
  "description": "A professional widget",
  "price": 29.99,
  "stock": 100,
  "createdAt": "2026-01-15T10:00:00.0000000Z"
}
```

---

### `GET /api/products` — Listar produtos (paginado)

**Query params:**

| Parâmetro  | Default | Máximo |
|------------|---------|--------|
| `page`     | `1`     | —      |
| `pageSize` | `20`    | `100`  |

**Response body (200):**
```json
{
  "items": [
    { "id": "...", "name": "Widget Pro", "price": 29.99, "stock": 100 }
  ],
  "totalCount": 1
}
```

---

### `GET /api/products/{id}` — Buscar produto por ID

**Respostas:**

| Status | Descrição                                 |
|--------|-------------------------------------------|
| `200`  | Produto encontrado                        |
| `404`  | Produto não encontrado (`ApiError`)       |

**Response body (200):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Widget Pro",
  "description": "A professional widget",
  "price": 29.99,
  "stock": 100,
  "createdAt": "2026-01-15T10:00:00.0000000Z",
  "updatedAt": "2026-01-15T10:00:00.0000000Z"
}
```

---

### `PUT /api/products/{id}` — Atualizar produto

**Request body:**
```json
{
  "name": "Updated Widget",
  "description": "Updated description",
  "price": 49.99,
  "stock": 200
}
```

**Respostas:**

| Status | Descrição                                 |
|--------|-------------------------------------------|
| `200`  | Produto atualizado                        |
| `400`  | Dados inválidos (`ApiError`)              |
| `404`  | Produto não encontrado (`ApiError`)       |

**Response body (200):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Updated Widget",
  "description": "Updated description",
  "price": 49.99,
  "stock": 200,
  "updatedAt": "2026-01-15T11:00:00.0000000Z"
}
```

---

### `DELETE /api/products/{id}` — Remover produto

**Respostas:**

| Status | Descrição                                 |
|--------|-------------------------------------------|
| `204`  | Produto removido (sem body)               |
| `404`  | Produto não encontrado (`ApiError`)       |

---

## 📄 Documentação OAS / Scalar

Com a API rodando em modo `Development`, os seguintes endpoints estão disponíveis:

| URL                   | Descrição                        |
|-----------------------|----------------------------------|
| `/openapi/v1.json`    | Contrato OpenAPI 3.1 (JSON)      |
| `/scalar/v1`          | UI interativa Scalar (deep space)|

O contrato é gerado **nativamente pelo runtime** do ASP.NET Core — sem `Swashbuckle` ou anotações XML. As metadata são configuradas via `AddDocumentTransformer` em `Program.cs`.

---

## 🧪 Testes de Integração (.NET)

Os testes de integração usam `WebApplicationFactory` para subir a API completa em memória (sem processo externo):

```bash
# Rodar todos os testes
dotnet test tests/VerticalSliceCrud.IntegrationTests

# Rodar um grupo específico
dotnet test --filter "FullyQualifiedName~CreateProductTests"
```

### Cobertura de cenários

| Arquivo de teste              | Cenários cobertos                          |
|-------------------------------|--------------------------------------------|
| `CreateProductTests.cs`       | 201 criado, 400 nome vazio, 400 preço negativo, 201 estoque zero, 400 nome longo, header `Location` |
| `GetProductByIdTests.cs`      | 200 encontrado, 404 não encontrado         |
| `GetAllProductsTests.cs`      | 200 lista vazia, 200 com itens, paginação  |
| `UpdateProductTests.cs`       | 200 atualizado, 400 validação, 404 não encontrado |
| `DeleteProductTests.cs`       | 204 removido, 404 não encontrado           |

A fixture `ApiWebApplicationFactory` cria um `HttpClient` apontado para a `TestServer` — nenhuma porta real é aberta.

---

## 🤝 Testes de Contrato — Consumer (PactumJS + Pact)

A pasta `tests/contract-tests/` contém os testes de contrato escritos em JavaScript.

### Como funciona

1. O **Pact mock server** (`@pact-foundation/pact`) sobe em memória na porta configurada (`PACT_MOCK_PORT`, padrão `4000`).
2. **PactumJS** (`pactum`) é usado como cliente HTTP para chamar o mock server dentro do `executeTest`.
3. Cada chamada do PactumJS é verificada contra a interação registrada no mock server.
4. Ao final do `executeTest`, o Pact framework gera o arquivo `.json` de contrato em `pacts/`.

### Pré-requisitos

```bash
cd tests/contract-tests
npm install
```

### Executar testes consumer

```bash
npm run test:consumer
```

Isso gera o arquivo `pacts/ProductsConsumer-VerticalSliceCrudApi.json` com **11 interações** cobrindo todos os endpoints e status codes da API.

### Interações cobertas

| Método | Rota                        | Status | Cenário                                |
|--------|-----------------------------|--------|----------------------------------------|
| POST   | `/api/products`             | 201    | Criação bem-sucedida                   |
| POST   | `/api/products`             | 400    | Nome vazio (validação)                 |
| GET    | `/api/products`             | 200    | Catálogo vazio                         |
| GET    | `/api/products`             | 200    | Com itens                              |
| GET    | `/api/products/{id}`        | 200    | Produto encontrado                     |
| GET    | `/api/products/{id}`        | 404    | Produto não encontrado                 |
| PUT    | `/api/products/{id}`        | 200    | Atualização bem-sucedida               |
| PUT    | `/api/products/{id}`        | 400    | Dados inválidos (nome vazio)           |
| PUT    | `/api/products/{id}`        | 404    | Produto não encontrado                 |
| DELETE | `/api/products/{id}`        | 204    | Remoção bem-sucedida                   |
| DELETE | `/api/products/{id}`        | 404    | Produto não encontrado                 |

### Detalhe: PactumJS como cliente HTTP

O PactumJS substitui `axios`/`fetch` nas chamadas dentro do `executeTest`:

```js
// consumer/products.consumer.test.js
const create201 = await pactum.spec()
  .post(`${mockServer.url}/api/products`)
  .withJson({ name: 'Widget Pro', description: 'A professional widget', price: 29.99, stock: 100 })
  .toss();

expect(create201.statusCode).toBe(201);
expect(create201.body).toHaveProperty('id');
```

O método `.toss()` executa a chamada e retorna `{ statusCode, body, headers }` sem lançar exceções por status de erro — ideal para verificar respostas 4xx também.

### Matching rules

O contrato usa matchers Pact V3 para flexibilidade:

| Matcher      | Uso                                               |
|--------------|---------------------------------------------------|
| `like()`     | Verifica apenas o tipo, não o valor exato         |
| `integer()`  | Verifica que é um inteiro                         |
| `decimal()`  | Verifica que é um número decimal                  |
| `uuid()`     | Regex de UUID                                     |
| `datetime()` | Formato ISO 8601 com 7 casas decimais             |
| `eachLike()` | Array com ao menos 1 item do tipo especificado    |

---

## ✅ Testes de Contrato — Provider (Pact Verifier)

O Pact Verifier replica cada interação do arquivo `.json` contra a API real e confirma que o provider honra o contrato.

### Pré-requisitos

A API .NET precisa estar rodando **antes** de executar a verificação:

```bash
# 1. Build da API
dotnet build src/VerticalSliceCrud.Api

# 2. Subir a API (porta padrão: 5055)
dotnet run --project src/VerticalSliceCrud.Api --no-build
```

### Executar verificação provider

```bash
cd tests/contract-tests
npm run test:provider
```

### Como funciona a verificação

Para cada interação do arquivo de pact:

1. O Pact Verifier chama o **state handler** correspondente para preparar o banco.
2. O Verifier faz a requisição HTTP descrita na interação contra `http://localhost:5055`.
3. A resposta real é comparada com o contrato usando os matching rules definidos pelo consumer.

### State handlers

Como o banco é EF Core InMemory (sem persistência entre execuções), os state handlers semeiam dados chamando os próprios endpoints da API:

| State                  | Ação                                              |
|------------------------|---------------------------------------------------|
| `no products exist`    | Nenhuma ação (banco já vazio em nova execução)    |
| `a product exists`     | `POST /api/products` para criar um produto        |

### Executar consumer + provider em sequência

```bash
npm run test:all
```

---

## 📝 Gravação de Contratos via C# (PactRecorder)

Além dos testes JavaScript, o projeto inclui um mecanismo alternativo de geração de contratos diretamente dos testes de integração .NET.

O `ContractRecordingTests` usa `WebApplicationFactory` para executar os mesmos 10 cenários e captura cada troca HTTP através de um `DelegatingHandler` customizado (`PactRecordingHandler`). O `PactRecorder` serializa tudo para Pact V3.

```bash
dotnet test --filter "FullyQualifiedName~ContractRecordingTests"
```

Saída: `tests/contract-tests/pacts/IntegrationTestsConsumer-VerticalSliceCrudApi.json`

Este arquivo pode ser publicado no Pact Broker e verificado pela suite provider JavaScript exatamente da mesma forma.

---

## 🔧 Geração de Contrato a partir do OAS

O script `generate-provider-pact-from-oas.js` converte o contrato OpenAPI da API em um arquivo Pact V3 automaticamente — útil para verificação provider sem precisar de consumer real.

```bash
cd tests/contract-tests

# A partir da API rodando localmente (padrão: http://localhost:5055/openapi/v1.json)
npm run generate:from-oas

# A partir de uma URL customizada
node scripts/generate-provider-pact-from-oas.js --oas-url http://meuservidor/openapi/v1.json

# A partir de um arquivo local
node scripts/generate-provider-pact-from-oas.js --oas-file ./openapi.json
```

**O que o script faz:**

1. Busca o OAS 3.1 da API (via HTTP ou arquivo).
2. Para cada operação (`GET`, `POST`, `PUT`, `DELETE`) × cada response status, gera uma interação Pact V3.
3. Deriva **matching rules** baseadas nos tipos do schema OAS (string, integer, number, uuid, date-time, array).
4. Infere o **provider state** adequado com base no método HTTP e status code.
5. Escreve `pacts/OasConsumer-VerticalSliceCrudApi.json`.

---

## 📦 Publicação no Pact Broker

O Pact Broker centraliza contratos e resultados de verificação, permitindo o fluxo **can-i-deploy**.

### Configurar

```bash
cd tests/contract-tests
cp .env.example .env
# Edite .env com a URL e token do seu Pact Broker
```

### Gerar os contratos consumer

```bash
npm run test:consumer
```

### Publicar no Broker

```bash
npm run publish:pacts
```

O script `publish-pacts.js` lê todos os `.json` da pasta `pacts/` e faz `PUT` para cada um no Broker via HTTP puro (sem dependência de CLI extra).

### Verificar com o Broker (provider)

Com `PACT_BROKER_BASE_URL` configurado no `.env`, o provider verification busca automaticamente os contratos do Broker e publica o resultado:

```bash
npm run test:provider
```

O Verifier usa `consumerVersionSelectors` para buscar contratos da branch principal e versões em produção.

---

## 🌐 Variáveis de Ambiente

Configure em `tests/contract-tests/.env` (copie de `.env.example`):

| Variável               | Padrão                    | Descrição                                          |
|------------------------|---------------------------|----------------------------------------------------|
| `PACT_BROKER_BASE_URL` | `http://localhost:9292`   | URL do Pact Broker                                 |
| `PACT_BROKER_TOKEN`    | _(vazio)_                 | Token de autenticação do Broker                    |
| `APP_VERSION`          | `local`                   | Versão do consumer (use SHA do commit em CI)       |
| `PACT_CONSUMER`        | `ProductsConsumer`        | Nome do consumer no contrato                       |
| `PACT_PROVIDER`        | `VerticalSliceCrudApi`    | Nome do provider no contrato                       |
| `API_PORT`             | `5055`                    | Porta onde a API .NET está rodando                 |
| `PACT_MOCK_PORT`       | `4000`                    | Porta do mock server Pact nos testes consumer      |
