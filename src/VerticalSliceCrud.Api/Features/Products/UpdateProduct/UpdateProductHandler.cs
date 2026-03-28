using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VerticalSliceCrud.Api.Common.Results;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.Api.Features.Products.UpdateProduct;

public sealed class UpdateProductHandler(
    AppDbContext db,
    IValidator<UpdateProductRequest> validator)
{
    public async Task<Result<UpdateProductResponse>> HandleAsync(
        Guid id, UpdateProductRequest request, CancellationToken ct = default)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Result.Failure<UpdateProductResponse>(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
            return Result.Failure<UpdateProductResponse>($"Produto com ID '{id}' não encontrado.");

        product.Update(request.Name, request.Description, request.Price, request.Stock);
        await db.SaveChangesAsync(ct);

        return Result.Success(new UpdateProductResponse(
            product.Id, product.Name, product.Description,
            product.Price, product.Stock, product.UpdatedAt));
    }
}
