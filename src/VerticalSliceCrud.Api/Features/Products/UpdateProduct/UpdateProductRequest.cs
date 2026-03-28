namespace VerticalSliceCrud.Api.Features.Products.UpdateProduct;

/// <summary>Payload para atualização de um produto.</summary>
public sealed record UpdateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int Stock
);
