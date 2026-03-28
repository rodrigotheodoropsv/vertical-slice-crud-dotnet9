using VerticalSliceCrud.Api.Common.Errors;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;
using VerticalSliceCrud.Api.Features.Products.GetAllProducts;
using VerticalSliceCrud.Api.Features.Products.GetProductById;
using VerticalSliceCrud.Api.Features.Products.UpdateProduct;
using VerticalSliceCrud.IntegrationTests.Fixtures;

namespace VerticalSliceCrud.IntegrationTests.PactRecording;

/// <summary>
/// Records consumer-side Pact interactions by driving the real in-memory API
/// through a <see cref="WebApplicationFactory"/> and capturing every HTTP
/// exchange as a type-based Pact V3 interaction.
///
/// All scenarios run in a single test method so that:
/// <list type="bullet">
///   <item>the shared <see cref="PactRecorder"/> accumulates all interactions
///         before writing the final contract file;</item>
///   <item>the in-memory database state is deterministic across scenarios.</item>
/// </list>
///
/// Covered interactions (11 total):
///   GET  /api/products       → 200 (empty), 200 (with items)
///   POST /api/products       → 201, 400
///   GET  /api/products/{id}  → 200, 404
///   PUT  /api/products/{id}  → 200, 400, 404
///   DELETE /api/products/{id}→ 204, 404
///
/// Output file:
///   tests/contract-tests/pacts/IntegrationTestsConsumer-VerticalSliceCrudApi.json
///
/// Run with:
///   dotnet test --filter "FullyQualifiedName~ContractRecordingTests"
/// </summary>
public sealed class ContractRecordingTests : IClassFixture<ApiWebApplicationFactory>, IAsyncLifetime
{
    private const string Consumer = "IntegrationTestsConsumer";
    private const string Provider = "VerticalSliceCrudApi";

    private readonly PactRecorder _recorder;
    private readonly PactRecordingHandler _handler;
    private readonly HttpClient _client;
    private readonly string _outputPath;

    public ContractRecordingTests(ApiWebApplicationFactory factory)
    {
        _recorder = new PactRecorder(Consumer, Provider);
        _handler  = new PactRecordingHandler(_recorder, autoRecordUnconfigured: true);
        // CreateDefaultClient injects the test-server handler as the innermost handler
        _client   = factory.CreateDefaultClient(_handler);
        _outputPath = Path.Combine(
            PactRecorder.ResolvePactsDirectory(),
            $"{Consumer}-{Provider}.json");
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        _recorder.WriteToFile(_outputPath);

        Assert.True(File.Exists(_outputPath),
            $"Pact file was not written to: {_outputPath}");

        var written = await File.ReadAllTextAsync(_outputPath);
        Assert.Contains("IntegrationTestsConsumer", written);
        Assert.Contains("VerticalSliceCrudApi", written);
    }

    [Fact]
    public async Task RecordAllConsumerInteractions()
    {
        // ── 1. GET /api/products — empty catalogue (database starts empty) ────
        var emptyListResp = await _client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, emptyListResp.StatusCode);
        var emptyList = await emptyListResp.Content.ReadFromJsonAsync<GetAllProductsResponse>();
        Assert.NotNull(emptyList);
        Assert.Equal(0, emptyList.TotalCount);

        // ── 2. POST /api/products — 400 Bad Request (empty name) ─────────────
        var create400Resp = await _client.PostAsJsonAsync("/api/products",
            new { name = "", description = "desc", price = 5.0, stock = 1 });
        Assert.Equal(HttpStatusCode.BadRequest, create400Resp.StatusCode);
        var error400 = await create400Resp.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error400);
        Assert.Equal(400, error400.Status);

        // ── 3. POST /api/products — 201 Created ──────────────────────────────
        var createResp = await _client.PostAsJsonAsync("/api/products",
            new CreateProductRequest("Widget Pro", "A professional widget", 29.99m, 100));
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<CreateProductResponse>();
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);

        // ── 4. GET /api/products — with items ────────────────────────────────
        var listResp = await _client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var list = await listResp.Content.ReadFromJsonAsync<GetAllProductsResponse>();
        Assert.NotNull(list);
        Assert.True(list.TotalCount > 0);

        // ── 5. GET /api/products/{id} — 200 OK ───────────────────────────────
        var getResp = await _client.GetAsync($"/api/products/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var product = await getResp.Content.ReadFromJsonAsync<GetProductByIdResponse>();
        Assert.NotNull(product);
        Assert.Equal(created.Id, product.Id);

        // ── 6. GET /api/products/{id} — 404 Not Found ────────────────────────
        var get404Resp = await _client.GetAsync($"/api/products/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, get404Resp.StatusCode);
        var error404Get = await get404Resp.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error404Get);
        Assert.Equal(404, error404Get.Status);

        // ── 7. PUT /api/products/{id} — 200 OK ───────────────────────────────
        var updateResp = await _client.PutAsJsonAsync($"/api/products/{created.Id}",
            new UpdateProductRequest("Updated Widget", "Updated description", 49.99m, 200));
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var updated = await updateResp.Content.ReadFromJsonAsync<UpdateProductResponse>();
        Assert.NotNull(updated);
        Assert.Equal("Updated Widget", updated.Name);

        // ── 8. PUT /api/products/{id} — 400 Bad Request (empty name) ─────────
        var update400Resp = await _client.PutAsJsonAsync($"/api/products/{Guid.NewGuid()}",
            new UpdateProductRequest("", null, 1.0m, 1));
        Assert.Equal(HttpStatusCode.BadRequest, update400Resp.StatusCode);
        var error400Put = await update400Resp.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error400Put);
        Assert.Equal(400, error400Put.Status);

        // ── 9. PUT /api/products/{id} — 404 Not Found ────────────────────────
        var update404Resp = await _client.PutAsJsonAsync($"/api/products/{Guid.NewGuid()}",
            new UpdateProductRequest("Name", null, 1.0m, 1));
        Assert.Equal(HttpStatusCode.NotFound, update404Resp.StatusCode);
        var error404Put = await update404Resp.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error404Put);
        Assert.Equal(404, error404Put.Status);

        // ── 10. DELETE /api/products/{id} — 204 No Content ───────────────────
        var deleteResp = await _client.DeleteAsync($"/api/products/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        // ── 11. DELETE /api/products/{id} — 404 Not Found ────────────────────
        var delete404Resp = await _client.DeleteAsync($"/api/products/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, delete404Resp.StatusCode);
        var error404Del = await delete404Resp.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error404Del);
        Assert.Equal(404, error404Del.Status);

    }
}
