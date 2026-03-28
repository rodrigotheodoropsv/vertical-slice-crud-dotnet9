using System.Text.Json.Serialization;
using Xunit;

namespace ProductsConsumer.ContractTests.Contracts;

public sealed class TypeContractBodyBuilderTests
{
    [Fact]
    public void Build_MapsJsonPropertyName_AndNestedObjects()
    {
        var body = TypeContractBodyBuilder.Build<NestedRequest>();

        var root = Assert.IsType<Dictionary<string, object?>>(body);
        Assert.Contains("customer", root.Keys);
        Assert.Contains("address_line_1", root.Keys);

        var customer = Assert.IsType<Dictionary<string, object?>>(root["customer"]);
        Assert.Contains("name", customer.Keys);
    }

    [Fact]
    public void Build_UsesStringEnumFormat_WhenConfigured()
    {
        var body = TypeContractBodyBuilder.Build<EnumRequest>(new ContractBuildOptions(
            EnumFormat.String,
            PropertyNamingPolicy.CamelCase,
            EmitNullForNullableValueTypes: false));

        var root = Assert.IsType<Dictionary<string, object?>>(body);
        Assert.Contains("status", root.Keys);
    }

    private sealed record NestedRequest(
        NestedCustomer Customer,
        [property: JsonPropertyName("address_line_1")] string AddressLine1);

    private sealed record NestedCustomer(string Name);

    private sealed record EnumRequest(Status Status);

    private enum Status
    {
        Pending,
        Approved,
    }
}
