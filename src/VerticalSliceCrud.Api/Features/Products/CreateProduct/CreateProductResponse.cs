namespace VerticalSliceCrud.Api.Features.Products.CreateProduct;

/// <summary>Resposta após criação de um produto.</summary>
public sealed record CreateProductResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    DateTime CreatedAt
);
