namespace VerticalSliceCrud.Api.Features.Products.GetAllProducts;

/// <summary>Item da lista de produtos.</summary>
public sealed record ProductSummary(
    Guid Id,
    string Name,
    decimal Price,
    int Stock
);

/// <summary>Resposta paginada de produtos.</summary>
public sealed record GetAllProductsResponse(
    IReadOnlyList<ProductSummary> Items,
    int TotalCount
);
