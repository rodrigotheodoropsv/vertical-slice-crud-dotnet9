using Microsoft.EntityFrameworkCore;
using VerticalSliceCrud.Api.Common.Results;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.Api.Features.Products.DeleteProduct;

public sealed class DeleteProductHandler(AppDbContext db)
{
    public async Task<Result<bool>> HandleAsync(Guid id, CancellationToken ct = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
            return Result.Failure<bool>($"Produto com ID '{id}' não encontrado.");

        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);

        return Result.Success(true);
    }
}
