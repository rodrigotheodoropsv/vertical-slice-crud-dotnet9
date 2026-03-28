namespace VerticalSliceCrud.Api.Features.Products.Models;

/// <summary>Entidade de domínio Product.</summary>
public sealed class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public int Stock { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Product() { }   // EF Core

    public static Product Create(string name, string? description, decimal price, int stock)
    {
        var now = DateTime.UtcNow;
        return new Product
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Price = price,
            Stock = stock,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void Update(string name, string? description, decimal price, int stock)
    {
        Name = name;
        Description = description;
        Price = price;
        Stock = stock;
        UpdatedAt = DateTime.UtcNow;
    }
}
