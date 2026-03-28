namespace VerticalSliceCrud.Api.Features.Products.GetAllProducts;

public static class GetAllProductsEndpoint
{
    public static IEndpointRouteBuilder MapGetAllProductsEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/products", async (
            GetAllProductsHandler handler,
            CancellationToken ct,
            int page = 1,
            int pageSize = 20) =>
        {
            var result = await handler.HandleAsync(page, pageSize, ct);
            return Results.Ok(result.Value);
        })
        .WithName("GetAllProducts")
        .WithTags("Products")
        .WithSummary("Lista todos os produtos")
        .WithDescription("Retorna lista paginada de produtos. Parâmetros: page (default 1), pageSize (default 20, max 100).")
        .Produces<GetAllProductsResponse>(StatusCodes.Status200OK);

        return app;
    }
}
