using VerticalSliceCrud.Api.Common.Errors;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;

namespace VerticalSliceCrud.IntegrationTests.Products;

public sealed class CreateProductTests(ApiWebApplicationFactory factory)
    : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateProduct_ValidRequest_Returns201WithBody()
    {
        var request = new CreateProductRequest("Widget", "A small widget", 9.99m, 50);

        var response = await _client.PostAsJsonAsync("/api/products", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CreateProductResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
        Assert.Equal("Widget", body.Name);
        Assert.Equal("A small widget", body.Description);
        Assert.Equal(9.99m, body.Price);
        Assert.Equal(50, body.Stock);
    }

    [Fact]
    public async Task CreateProduct_ValidRequest_SetsLocationHeader()
    {
        var request = new CreateProductRequest("Gadget", null, 1.00m, 10);

        var response = await _client.PostAsJsonAsync("/api/products", request);
        var body = await response.Content.ReadFromJsonAsync<CreateProductResponse>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Contains(body!.Id.ToString(), response.Headers.Location!.ToString());
    }

    [Fact]
    public async Task CreateProduct_EmptyName_Returns400()
    {
        var request = new CreateProductRequest("", null, 5.00m, 0);

        var response = await _client.PostAsJsonAsync("/api/products", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.NotNull(error);
        Assert.Equal(400, error.Status);
    }

    [Fact]
    public async Task CreateProduct_NegativePrice_Returns400()
    {
        var request = new CreateProductRequest("Bad Product", null, -1m, 10);

        var response = await _client.PostAsJsonAsync("/api/products", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateProduct_ZeroStock_Returns201()
    {
        var request = new CreateProductRequest("Out Of Stock Item", null, 5.99m, 0);

        var response = await _client.PostAsJsonAsync("/api/products", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateProduct_NameExceedsMaxLength_Returns400()
    {
        var longName = new string('A', 201);
        var request = new CreateProductRequest(longName, null, 1.00m, 1);

        var response = await _client.PostAsJsonAsync("/api/products", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
