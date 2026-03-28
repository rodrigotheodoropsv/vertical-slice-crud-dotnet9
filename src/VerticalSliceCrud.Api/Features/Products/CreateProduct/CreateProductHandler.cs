using FluentValidation;
using VerticalSliceCrud.Api.Common.Results;
using VerticalSliceCrud.Api.Features.Products.Models;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.Api.Features.Products.CreateProduct;

public sealed class CreateProductHandler(
    AppDbContext db,
    IValidator<CreateProductRequest> validator)
{
    public async Task<Result<CreateProductResponse>> HandleAsync(
        CreateProductRequest request,
        CancellationToken ct = default)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Result.Failure<CreateProductResponse>(
                string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var product = Product.Create(request.Name, request.Description, request.Price, request.Stock);

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        return Result.Success(new CreateProductResponse(
            product.Id, product.Name, product.Description,
            product.Price, product.Stock, product.CreatedAt));
    }
}
