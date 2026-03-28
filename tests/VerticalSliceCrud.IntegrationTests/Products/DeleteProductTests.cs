using VerticalSliceCrud.Api.Common.Errors;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;

namespace VerticalSliceCrud.IntegrationTests.Products;

public sealed class DeleteProductTests(ApiWebApplicationFactory factory)
    : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<Guid> CreateProductAsync(string name = "To Delete")
    {
        var request = new CreateProductRequest(name, null, 1.00m, 1);
        var response = await _client.PostAsJsonAsync("/api/products", request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<CreateProductResponse>();
        return body!.Id;
    }

    [Fact]
    public async Task DeleteProduct_ExistingProduct_Returns204()
    {
        var id = await CreateProductAsync();

        var response = await _client.DeleteAsync($"/api/products/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteProduct_ExistingProduct_SubsequentGetReturns404()
    {
        var id = await CreateProductAsync();

        await _client.DeleteAsync($"/api/products/{id}");
        var getResponse = await _client.GetAsync($"/api/products/{id}");

        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteProduct_NonExistingProduct_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/products/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error);
        Assert.Equal(404, error.Status);
    }

    [Fact]
    public async Task DeleteProduct_DeletedProductNotReturnedInList()
    {
        var id = await CreateProductAsync("Listed Product");

        await _client.DeleteAsync($"/api/products/{id}");

        var listResponse = await _client.GetAsync("/api/products");
        listResponse.EnsureSuccessStatusCode();
        var content = await listResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain(id.ToString(), content);
    }
}
