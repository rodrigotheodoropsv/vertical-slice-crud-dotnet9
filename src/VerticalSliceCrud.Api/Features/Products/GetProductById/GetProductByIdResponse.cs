namespace VerticalSliceCrud.Api.Features.Products.GetProductById;

/// <summary>Retorno de um produto por ID.</summary>
public sealed record GetProductByIdResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    int Stock,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
