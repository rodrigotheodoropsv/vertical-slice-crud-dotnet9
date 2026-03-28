using VerticalSliceCrud.Api.Common.Errors;

namespace VerticalSliceCrud.Api.Features.Products.GetProductById;

public static class GetProductByIdEndpoint
{
    public static IEndpointRouteBuilder MapGetProductByIdEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/products/{id:guid}", async (
            Guid id,
            GetProductByIdHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(id, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.NotFound(new ApiError(
                    "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    "Not Found",
                    404,
                    result.Error!));
        })
        .WithName("GetProductById")
        .WithTags("Products")
        .WithSummary("Busca produto por ID")
        .Produces<GetProductByIdResponse>(StatusCodes.Status200OK)
        .Produces<ApiError>(StatusCodes.Status404NotFound);

        return app;
    }
}
