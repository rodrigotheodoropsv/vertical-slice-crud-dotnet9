using VerticalSliceCrud.Api.Common.Errors;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;
using VerticalSliceCrud.Api.Features.Products.GetProductById;

namespace VerticalSliceCrud.IntegrationTests.Products;

public sealed class GetProductByIdTests(ApiWebApplicationFactory factory)
    : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<Guid> CreateProductAsync(string name = "Test Product")
    {
        var request = new CreateProductRequest(name, "Description", 10.00m, 5);
        var response = await _client.PostAsJsonAsync("/api/products", request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<CreateProductResponse>();
        return body!.Id;
    }

    [Fact]
    public async Task GetProductById_ExistingProduct_Returns200WithBody()
    {
        var id = await CreateProductAsync("My Product");

        var response = await _client.GetAsync($"/api/products/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetProductByIdResponse>();
        Assert.NotNull(body);
        Assert.Equal(id, body.Id);
        Assert.Equal("My Product", body.Name);
    }

    [Fact]
    public async Task GetProductById_NonExistingProduct_Returns404()
    {
        var response = await _client.GetAsync($"/api/products/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error);
        Assert.Equal(404, error.Status);
    }

    [Fact]
    public async Task GetProductById_ReturnsAllFields()
    {
        var id = await CreateProductAsync("Full Fields Product");

        var response = await _client.GetAsync($"/api/products/{id}");
        var body = await response.Content.ReadFromJsonAsync<GetProductByIdResponse>();

        Assert.NotNull(body);
        Assert.NotEqual(default, body.CreatedAt);
        Assert.NotEqual(default, body.UpdatedAt);
        Assert.Equal(10.00m, body.Price);
        Assert.Equal(5, body.Stock);
    }
}
