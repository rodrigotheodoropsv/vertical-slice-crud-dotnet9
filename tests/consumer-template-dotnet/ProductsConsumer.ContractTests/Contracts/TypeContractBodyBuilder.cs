using System.Collections;
using System.Reflection;
using System.Text.Json.Serialization;
using PactNet.Matchers;

namespace ProductsConsumer.ContractTests.Contracts;

internal static class TypeContractBodyBuilder
{
    private const string UuidRegex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    private const int MaxObjectDepth = 8;

    public static object Build<T>(ContractBuildOptions? options = null)
        => BuildForType(typeof(T), options ?? ContractBuildOptions.Default, 0, []);

    private static object BuildForType(Type type, ContractBuildOptions options, int depth, HashSet<Type> seen)
    {
        if (depth > MaxObjectDepth)
            return Match.Type("max-depth");

        var actualType = Nullable.GetUnderlyingType(type) ?? type;
        var isNullable = Nullable.GetUnderlyingType(type) is not null;

        if (isNullable && options.EmitNullForNullableValueTypes)
            return null!;

        if (actualType == typeof(string)) return Match.Type("sample");
        if (actualType == typeof(int) || actualType == typeof(long) || actualType == typeof(short) || actualType == typeof(byte)) return Match.Integer(1);
        if (actualType == typeof(decimal) || actualType == typeof(double) || actualType == typeof(float)) return Match.Decimal(1.0m);
        if (actualType == typeof(bool)) return Match.Type(true);
        if (actualType == typeof(Guid)) return Match.Regex(Guid.NewGuid().ToString(), UuidRegex);
        if (actualType == typeof(DateTime) || actualType == typeof(DateTimeOffset)) return Match.Type("2026-01-15T10:00:00.0000000Z");

        if (actualType.IsEnum)
        {
            var enumValues = Enum.GetValues(actualType);
            if (enumValues.Length == 0) return Match.Type(0);

            var first = enumValues.GetValue(0)!;
            if (options.EnumFormat == EnumFormat.String)
                return Match.Type(Enum.GetName(actualType, first) ?? first.ToString() ?? "Unknown");

            return Match.Type(Convert.ToInt32(first));
        }

        if (typeof(IEnumerable).IsAssignableFrom(actualType) && actualType != typeof(string))
        {
            var elementType = GetElementType(actualType) ?? typeof(string);
            return new[] { BuildForType(elementType, options, depth + 1, seen) };
        }

        if (seen.Contains(actualType))
            return Match.Type("recursive-ref");

        seen.Add(actualType);

        var body = new Dictionary<string, object?>();

        foreach (var property in actualType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (!property.CanRead) continue;

            var jsonName = property.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name
                ?? (options.PropertyNamingPolicy == PropertyNamingPolicy.CamelCase
                    ? ToCamelCase(property.Name)
                    : property.Name);

            body[jsonName] = BuildForType(property.PropertyType, options, depth + 1, seen);
        }

        seen.Remove(actualType);

        return body;
    }

    private static Type? GetElementType(Type collectionType)
    {
        if (collectionType.IsArray) return collectionType.GetElementType();

        var genericEnumerable = collectionType
            .GetInterfaces()
            .FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>));

        return genericEnumerable?.GetGenericArguments()[0];
    }

    private static string ToCamelCase(string value)
    {
        if (string.IsNullOrEmpty(value) || char.IsLower(value[0])) return value;
        return char.ToLowerInvariant(value[0]) + value[1..];
    }
}

internal sealed record ContractBuildOptions(
    EnumFormat EnumFormat,
    PropertyNamingPolicy PropertyNamingPolicy,
    bool EmitNullForNullableValueTypes)
{
    public static ContractBuildOptions Default { get; } = new(
        EnumFormat: EnumFormat.Numeric,
        PropertyNamingPolicy: PropertyNamingPolicy.CamelCase,
        EmitNullForNullableValueTypes: false);
}

internal enum EnumFormat
{
    Numeric,
    String,
}

internal enum PropertyNamingPolicy
{
    CamelCase,
    PascalCase,
}
