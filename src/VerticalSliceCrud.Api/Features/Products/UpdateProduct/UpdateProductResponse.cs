namespace VerticalSliceCrud.Api.Features.Products.UpdateProduct;

/// <summary>Retorno após atualização de um produto.</summary>
public sealed record UpdateProductResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    DateTime UpdatedAt
);
