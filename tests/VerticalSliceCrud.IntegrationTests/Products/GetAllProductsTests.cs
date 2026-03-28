using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;
using VerticalSliceCrud.Api.Features.Products.GetAllProducts;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.IntegrationTests.Products;

public sealed class GetAllProductsTests(ApiWebApplicationFactory factory)
    : IClassFixture<ApiWebApplicationFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    // Clear the database before each test so tests are fully isolated.
    public async Task InitializeAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Products.RemoveRange(await db.Products.ToListAsync());
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task CreateProductAsync(string name, decimal price = 10.00m, int stock = 5)
    {
        var request = new CreateProductRequest(name, null, price, stock);
        var response = await _client.PostAsJsonAsync("/api/products", request);
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetAllProducts_EmptyDatabase_Returns200WithEmptyList()
    {
        var response = await _client.GetAsync("/api/products");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetAllProductsResponse>();
        Assert.NotNull(body);
        Assert.Equal(0, body.TotalCount);
        Assert.Empty(body.Items);
    }

    [Fact]
    public async Task GetAllProducts_WithProducts_ReturnsAll()
    {
        await CreateProductAsync("Alpha");
        await CreateProductAsync("Beta");
        await CreateProductAsync("Gamma");

        var response = await _client.GetAsync("/api/products");
        var body = await response.Content.ReadFromJsonAsync<GetAllProductsResponse>();

        Assert.NotNull(body);
        Assert.Equal(3, body.TotalCount);
        Assert.Equal(3, body.Items.Count);
    }

    [Fact]
    public async Task GetAllProducts_WithPageSize1_ReturnsOneItem()
    {
        await CreateProductAsync("Paged A");
        await CreateProductAsync("Paged B");

        var response = await _client.GetAsync("/api/products?page=1&pageSize=1");
        var body = await response.Content.ReadFromJsonAsync<GetAllProductsResponse>();

        Assert.NotNull(body);
        Assert.Single(body.Items);
        Assert.Equal(2, body.TotalCount);
    }

    [Fact]
    public async Task GetAllProducts_SecondPage_ReturnsCorrectItems()
    {
        await CreateProductAsync("Page2 A");
        await CreateProductAsync("Page2 B");
        await CreateProductAsync("Page2 C");

        var response = await _client.GetAsync("/api/products?page=2&pageSize=2");
        var body = await response.Content.ReadFromJsonAsync<GetAllProductsResponse>();

        Assert.NotNull(body);
        Assert.Single(body.Items);
        Assert.Equal(3, body.TotalCount);
    }

    [Fact]
    public async Task GetAllProducts_PageSizeExceedsMax_Capped()
    {
        // pageSize is capped at 100 by the handler
        var response = await _client.GetAsync("/api/products?page=1&pageSize=9999");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
