using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using VerticalSliceCrud.Api.Features.Products.CreateProduct;
using VerticalSliceCrud.Api.Features.Products.DeleteProduct;
using VerticalSliceCrud.Api.Features.Products.GetAllProducts;
using VerticalSliceCrud.Api.Features.Products.GetProductById;
using VerticalSliceCrud.Api.Features.Products.UpdateProduct;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ── InMemory EF Core ──────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseInMemoryDatabase("VerticalSliceCrudDb"));

// ── Handlers (Vertical Slice – sem MediatR) ───────────────────────────────────
builder.Services.AddScoped<CreateProductHandler>();
builder.Services.AddScoped<GetProductByIdHandler>();
builder.Services.AddScoped<GetAllProductsHandler>();
builder.Services.AddScoped<UpdateProductHandler>();
builder.Services.AddScoped<DeleteProductHandler>();

// ── FluentValidation ──────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ── OAS / OpenAPI ─────────────────────────────────────────────────────────────
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((doc, _, _) =>
    {
        doc.Info.Title = "Vertical Slice CRUD API";
        doc.Info.Version = "v1";
        doc.Info.Contact = new()
        {
            Name = "rodrigotheodoropsv",
            Email = "rodrigo@example.com"
        };
        return Task.CompletedTask;
    });
});

var app = builder.Build();

// ── Middleware ─────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                          // expõe /openapi/v1.json
    app.MapScalarApiReference(opt =>           // UI em /scalar/v1
    {
        opt.Title = "Vertical Slice CRUD API";
        opt.Theme = ScalarTheme.DeepSpace;
    });
}

app.UseHttpsRedirection();

// ── Feature Endpoints ──────────────────────────────────────────────────────────
app.MapCreateProductEndpoint();
app.MapGetProductByIdEndpoint();
app.MapGetAllProductsEndpoint();
app.MapUpdateProductEndpoint();
app.MapDeleteProductEndpoint();

app.Run();
