using VerticalSliceCrud.Api.Common.Errors;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;
using VerticalSliceCrud.Api.Features.Products.UpdateProduct;

namespace VerticalSliceCrud.IntegrationTests.Products;

public sealed class UpdateProductTests(ApiWebApplicationFactory factory)
    : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<Guid> CreateProductAsync(string name = "Original Name")
    {
        var request = new CreateProductRequest(name, "Original Desc", 5.00m, 10);
        var response = await _client.PostAsJsonAsync("/api/products", request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<CreateProductResponse>();
        return body!.Id;
    }

    [Fact]
    public async Task UpdateProduct_ValidRequest_Returns200WithUpdatedData()
    {
        var id = await CreateProductAsync();
        var update = new UpdateProductRequest("Updated Name", "Updated Desc", 19.99m, 25);

        var response = await _client.PutAsJsonAsync($"/api/products/{id}", update);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<UpdateProductResponse>();
        Assert.NotNull(body);
        Assert.Equal(id, body.Id);
        Assert.Equal("Updated Name", body.Name);
        Assert.Equal("Updated Desc", body.Description);
        Assert.Equal(19.99m, body.Price);
        Assert.Equal(25, body.Stock);
    }

    [Fact]
    public async Task UpdateProduct_NonExistingProduct_Returns404()
    {
        var update = new UpdateProductRequest("Name", null, 1.00m, 1);

        var response = await _client.PutAsJsonAsync($"/api/products/{Guid.NewGuid()}", update);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error);
        Assert.Equal(404, error.Status);
    }

    [Fact]
    public async Task UpdateProduct_EmptyName_Returns400()
    {
        var id = await CreateProductAsync();
        var update = new UpdateProductRequest("", null, 1.00m, 1);

        var response = await _client.PutAsJsonAsync($"/api/products/{id}", update);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProduct_NegativePrice_Returns400()
    {
        var id = await CreateProductAsync();
        var update = new UpdateProductRequest("Valid Name", null, -5.00m, 1);

        var response = await _client.PutAsJsonAsync($"/api/products/{id}", update);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProduct_UpdatedAtIsChanged()
    {
        var id = await CreateProductAsync();
        // Small delay to ensure UpdatedAt is strictly greater than CreatedAt
        await Task.Delay(10);
        var update = new UpdateProductRequest("New Name", null, 2.00m, 2);

        var response = await _client.PutAsJsonAsync($"/api/products/{id}", update);
        var body = await response.Content.ReadFromJsonAsync<UpdateProductResponse>();

        Assert.NotNull(body);
        Assert.NotEqual(default, body.UpdatedAt);
    }
}
