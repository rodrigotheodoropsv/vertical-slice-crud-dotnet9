using Microsoft.EntityFrameworkCore;
using VerticalSliceCrud.Api.Common.Results;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.Api.Features.Products.GetAllProducts;

public sealed class GetAllProductsHandler(AppDbContext db)
{
    public async Task<Result<GetAllProductsResponse>> HandleAsync(
        int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Products.AsNoTracking().OrderBy(p => p.Name);

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductSummary(p.Id, p.Name, p.Price, p.Stock))
            .ToListAsync(ct);

        return Result.Success(new GetAllProductsResponse(items, total));
    }
}
