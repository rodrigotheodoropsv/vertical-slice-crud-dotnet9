# ProductsConsumer.ContractTests (.NET)

Template de consumer externo para gerar contrato Pact automaticamente no lado consumidor.

Este template gera os campos de request/response do contrato a partir dos DTOs C#
via reflexao (`TypeContractBodyBuilder`), reduzindo escrita manual de payloads.

Capacidades do builder:

- DTOs aninhados e colecoes.
- `JsonPropertyName` para nomes de campo no contrato.
- Configuracao de enum como numero ou string.
- Configuracao de politica de nome (camelCase ou PascalCase).

## Como usar

1. Copie este projeto para o repositório da API consumidora.
2. Ajuste o nome do consumer em `CreateProductPactTests.cs`.
3. Aponte o `ProductApiClient` para os endpoints que o seu consumer realmente usa.
4. Atualize os DTOs do client (request/response) conforme seu consumo real.
5. Rode os testes e publique o pacto no broker.

## Executar

```bash
dotnet test
```

Saida esperada:

- Arquivo de pacto em `tests/contract-tests/pacts/ExternalCatalogConsumer-VerticalSliceCrudApi.json`.

## O que torna este fluxo escalavel

- O contrato nasce no repositorio do consumer real.
- O time de provider nao precisa codar cenarios especificos de cada consumer.
- O provider apenas verifica os pacts publicados no broker.

## Pipeline sugerido (consumer)

1. `dotnet test` dos testes Pact.
2. Publicar o arquivo pact no broker com versao/tag da build.
3. Opcional: executar `can-i-deploy` antes de promover release do consumer.
