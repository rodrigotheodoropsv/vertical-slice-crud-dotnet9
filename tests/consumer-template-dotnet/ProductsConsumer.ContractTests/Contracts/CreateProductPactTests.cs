using System.Net;
using PactNet;
using PactNet.Matchers;
using ProductsConsumer.ContractTests.Client;
using Xunit;

namespace ProductsConsumer.ContractTests.Contracts;

public sealed class CreateProductPactTests
{
    [Fact]
    public async Task CreateProduct_GeneratesConsumerContract_Automatically()
    {
        var pactDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../contract-tests/pacts"));
        var requestBody = TypeContractBodyBuilder.Build<CreateProductRequest>();
        var responseBody = TypeContractBodyBuilder.Build<CreateProductResponse>();

        var pact = Pact.V4("ExternalCatalogConsumer", "VerticalSliceCrudApi", new PactConfig
        {
            PactDir = pactDir,
        });

        var http = pact.WithHttpInteractions();

        http
            .UponReceiving("a valid create product request")
            .Given("no products exist")
            .WithRequest(HttpMethod.Post, "/api/products")
            .WithHeader("Content-Type", "application/json")
            .WithJsonBody(requestBody)
            .WillRespond()
            .WithStatus(HttpStatusCode.Created)
            .WithHeader("Content-Type", Match.Regex("application/json; charset=utf-8", "application\\/json.*"))
            .WithJsonBody(responseBody);

        await http.VerifyAsync(async ctx =>
        {
            using var client = new HttpClient { BaseAddress = ctx.MockServerUri };
            var apiClient = new ProductApiClient(client);

            var result = await apiClient.CreateProductAsync(
                new CreateProductRequest("Widget Pro", "A professional widget", 29.99m, 100));

            Assert.NotEqual(Guid.Empty, result.Id);
            Assert.False(string.IsNullOrWhiteSpace(result.Name));
        });
    }
}
