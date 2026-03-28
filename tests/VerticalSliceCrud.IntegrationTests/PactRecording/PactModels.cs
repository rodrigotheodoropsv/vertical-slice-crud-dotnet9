using System.Text.Json.Nodes;

namespace VerticalSliceCrud.IntegrationTests.PactRecording;

/// <summary>
/// A single Pact V3 interaction (one request/response pair) captured during
/// an integration test run.
/// </summary>
internal sealed record PactInteraction(
    string Description,
    IReadOnlyList<string> ProviderStates,
    PactRequest Request,
    PactResponse Response)
{
    /// <summary>Serialises the interaction to a <see cref="JsonObject"/> in Pact V3 format.</summary>
    public JsonObject ToJsonObject() => new()
    {
        ["description"]    = Description,
        ["providerStates"] = new JsonArray(
            ProviderStates
                .Select(s => (JsonNode)new JsonObject { ["name"] = s })
                .ToArray()),
        ["request"]  = Request.ToJsonObject(),
        ["response"] = Response.ToJsonObject(),
    };
}

/// <summary>Pact V3 request descriptor.</summary>
internal sealed record PactRequest(
    string Method,
    string Path,
    Dictionary<string, string>? Headers = null,
    JsonNode? Body = null)
{
    public JsonObject ToJsonObject()
    {
        var obj = new JsonObject
        {
            ["method"] = Method,
            ["path"]   = Path,
        };

        if (Headers is { Count: > 0 })
        {
            var headersNode = new JsonObject();
            foreach (var (k, v) in Headers) headersNode[k] = v;
            obj["headers"] = headersNode;
        }

        if (Body is not null)
            obj["body"] = Body.DeepClone();

        return obj;
    }
}

/// <summary>Pact V3 response descriptor, including optional matching rules.</summary>
internal sealed record PactResponse(
    int Status,
    Dictionary<string, string>? Headers = null,
    JsonNode? Body = null,
    JsonObject? MatchingRules = null)
{
    public JsonObject ToJsonObject()
    {
        var obj = new JsonObject { ["status"] = Status };

        if (Headers is { Count: > 0 })
        {
            var headersNode = new JsonObject();
            foreach (var (k, v) in Headers) headersNode[k] = v;
            obj["headers"] = headersNode;
        }

        if (Body is not null)
            obj["body"] = Body.DeepClone();

        if (MatchingRules is not null)
            obj["matchingRules"] = MatchingRules.DeepClone();

        return obj;
    }
}
