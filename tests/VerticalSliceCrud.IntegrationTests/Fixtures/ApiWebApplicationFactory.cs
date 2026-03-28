using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VerticalSliceCrud.Api.Infrastructure.Persistence;

namespace VerticalSliceCrud.IntegrationTests.Fixtures;

/// <summary>
/// Custom WebApplicationFactory that wires up an isolated InMemory database for each
/// test class, so tests are hermetic and require no external infrastructure.
/// </summary>
public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Use Development so the OpenAPI spec (/openapi/v1.json) is available
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Replace whatever DbContext registration the app uses with a fresh
            // isolated InMemory database unique to this factory instance.
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}
