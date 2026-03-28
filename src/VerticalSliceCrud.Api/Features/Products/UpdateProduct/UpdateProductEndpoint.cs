using VerticalSliceCrud.Api.Common.Errors;

namespace VerticalSliceCrud.Api.Features.Products.UpdateProduct;

public static class UpdateProductEndpoint
{
    public static IEndpointRouteBuilder MapUpdateProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/products/{id:guid}", async (
            Guid id,
            UpdateProductRequest request,
            UpdateProductHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(id, request, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.Error!.Contains("não encontrado")
                    ? Results.NotFound(new ApiError(
                        "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                        "Not Found", 404, result.Error!))
                    : Results.BadRequest(new ApiError(
                        "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                        "Validation Error", 400, result.Error!));
        })
        .WithName("UpdateProduct")
        .WithTags("Products")
        .WithSummary("Atualiza um produto")
        .Produces<UpdateProductResponse>(StatusCodes.Status200OK)
        .Produces<ApiError>(StatusCodes.Status400BadRequest)
        .Produces<ApiError>(StatusCodes.Status404NotFound);

        return app;
    }
}
