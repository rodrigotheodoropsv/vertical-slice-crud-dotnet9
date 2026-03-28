using System.Net.Http.Json;

namespace ProductsConsumer.ContractTests.Client;

internal sealed class ProductApiClient(HttpClient httpClient)
{
    public async Task<CreateProductResponse> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var response = await httpClient.PostAsJsonAsync("/api/products", request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<CreateProductResponse>(cancellationToken: cancellationToken);
        return payload ?? throw new InvalidOperationException("Provider returned empty response payload.");
    }
}

internal sealed record CreateProductRequest(string Name, string Description, decimal Price, int Stock);
internal sealed record CreateProductResponse(Guid Id, string Name, string Description, decimal Price, int Stock, DateTimeOffset CreatedAt);
