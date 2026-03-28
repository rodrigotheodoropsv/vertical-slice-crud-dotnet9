using VerticalSliceCrud.Api.Common.Errors;

namespace VerticalSliceCrud.Api.Features.Products.CreateProduct;

public static class CreateProductEndpoint
{
    public static IEndpointRouteBuilder MapCreateProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/products", async (
            CreateProductRequest request,
            CreateProductHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);

            return result.IsSuccess
                ? Results.Created($"/api/products/{result.Value!.Id}", result.Value)
                : Results.BadRequest(new ApiError(
                    "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    "Validation Error",
                    400,
                    result.Error!));
        })
        .WithName("CreateProduct")
        .WithTags("Products")
        .WithSummary("Cria um novo produto")
        .WithDescription("Cria um produto com nome, descrição, preço e estoque.")
        .Produces<CreateProductResponse>(StatusCodes.Status201Created)
        .Produces<ApiError>(StatusCodes.Status400BadRequest);

        return app;
    }
}
