using Microsoft.EntityFrameworkCore;
using VerticalSliceCrud.Api.Common.Results;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.Api.Features.Products.GetProductById;

public sealed class GetProductByIdHandler(AppDbContext db)
{
    public async Task<Result<GetProductByIdResponse>> HandleAsync(Guid id, CancellationToken ct = default)
    {
        var product = await db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product is null)
            return Result.Failure<GetProductByIdResponse>($"Produto com ID '{id}' não encontrado.");

        return Result.Success(new GetProductByIdResponse(
            product.Id, product.Name, product.Description,
            product.Price, product.Stock, product.CreatedAt, product.UpdatedAt));
    }
}
