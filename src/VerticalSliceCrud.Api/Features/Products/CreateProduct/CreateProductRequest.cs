namespace VerticalSliceCrud.Api.Features.Products.CreateProduct;

/// <summary>Payload para criação de um produto.</summary>
public sealed record CreateProductRequest(
    string Name,
    string? Description,
    decimal Price,
    int Stock
);
