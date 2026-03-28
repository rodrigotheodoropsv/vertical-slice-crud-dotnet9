using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace VerticalSliceCrud.IntegrationTests.PactRecording;

/// <summary>
/// Derives Pact V3 matching rules from a concrete JSON response body captured
/// during an integration test.  Rules are type-based rather than value-based so
/// that the generated contract is flexible to benign value changes while still
/// enforcing the API's structural contract.
/// </summary>
internal static partial class MatchingRuleBuilder
{
    [GeneratedRegex(
        @"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        RegexOptions.IgnoreCase)]
    private static partial Regex GuidPattern();

    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")]
    private static partial Regex DateTimePattern();

    /// <summary>
    /// Builds a Pact V3 <c>matchingRules</c> object from the supplied response body.
    /// Returns an empty <see cref="JsonObject"/> when <paramref name="body"/> is null.
    /// </summary>
    public static JsonObject Build(JsonNode? body)
    {
        var rules = new JsonObject();
        if (body is not null)
            Walk(body, "$", rules);
        return rules;
    }

    private static void Walk(JsonNode node, string path, JsonObject rules)
    {
        switch (node)
        {
            case JsonObject obj:
                foreach (var prop in obj)
                    if (prop.Value is not null)
                        Walk(prop.Value, $"{path}.{prop.Key}", rules);
                break;

            case JsonArray arr:
                // Arrays: verify type and allow any count ≥ 0
                rules[path] = MakeRule("type", min: 0);
                // Walk the first element to generate rules for nested properties
                if (arr.Count > 0 && arr[0] is not null)
                    Walk(arr[0]!, $"{path}[*]", rules);
                break;

            case JsonValue val:
                rules[path] = DeriveValueRule(val);
                break;
        }
    }

    private static JsonObject DeriveValueRule(JsonValue val)
    {
        // String — check for UUID and datetime formats before falling back to type
        if (val.TryGetValue(out string? str) && str is not null)
        {
            if (GuidPattern().IsMatch(str))
                return MakeRegexRule(
                    @"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

            if (DateTimePattern().IsMatch(str))
                return MakeDateTimeRule("yyyy-MM-dd'T'HH:mm:ss.SSSSSSS'Z'");

            return MakeRule("type");
        }

        // Integer — must be checked before double because integers satisfy double too
        if (val.TryGetValue(out long _) || val.TryGetValue(out int _))
            return MakeRule("integer");

        // Decimal / floating-point number
        if (val.TryGetValue(out double _) || val.TryGetValue(out float _))
            return MakeRule("decimal");

        // Boolean or anything else
        return MakeRule("type");
    }

    // ── Rule factory helpers ──────────────────────────────────────────────────

    private static JsonObject MakeRule(string match, int? min = null)
    {
        var matcher = new JsonObject { ["match"] = match };
        if (min.HasValue) matcher["min"] = min.Value;
        return new JsonObject
        {
            ["combine"]  = "AND",
            ["matchers"] = new JsonArray(matcher),
        };
    }

    private static JsonObject MakeRegexRule(string regex) => new()
    {
        ["combine"]  = "AND",
        ["matchers"] = new JsonArray(new JsonObject
        {
            ["match"] = "regex",
            ["regex"] = regex,
        }),
    };

    private static JsonObject MakeDateTimeRule(string format) => new()
    {
        ["combine"]  = "AND",
        ["matchers"] = new JsonArray(new JsonObject
        {
            ["match"]  = "datetime",
            ["format"] = format,
        }),
    };
}
