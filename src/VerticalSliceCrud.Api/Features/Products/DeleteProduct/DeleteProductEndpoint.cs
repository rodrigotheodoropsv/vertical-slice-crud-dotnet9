using VerticalSliceCrud.Api.Common.Errors;

namespace VerticalSliceCrud.Api.Features.Products.DeleteProduct;

public static class DeleteProductEndpoint
{
    public static IEndpointRouteBuilder MapDeleteProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/products/{id:guid}", async (
            Guid id,
            DeleteProductHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(id, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : Results.NotFound(new ApiError(
                    "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    "Not Found",
                    404,
                    result.Error!));
        })
        .WithName("DeleteProduct")
        .WithTags("Products")
        .WithSummary("Remove um produto")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ApiError>(StatusCodes.Status404NotFound);

        return app;
    }
}
