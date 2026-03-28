using System.Text.Json;
using System.Text.Json.Nodes;

namespace VerticalSliceCrud.IntegrationTests.PactRecording;

/// <summary>
/// Accumulates <see cref="PactInteraction"/> objects observed during integration
/// tests and serialises them as a Pact V3-compatible JSON contract file.
/// </summary>
internal sealed class PactRecorder
{
    private readonly string _consumer;
    private readonly string _provider;
    private readonly List<PactInteraction> _interactions = [];
    private readonly Lock _lock = new();

    public PactRecorder(string consumer, string provider)
    {
        _consumer = consumer;
        _provider = provider;
    }

    /// <summary>Adds an interaction captured from a live HTTP exchange.</summary>
    public void AddInteraction(PactInteraction interaction)
    {
        lock (_lock) _interactions.Add(interaction);
    }

    /// <summary>
    /// Writes all accumulated interactions to <paramref name="filePath"/> as a
    /// Pact V3 JSON document.  Parent directories are created automatically.
    /// </summary>
    public void WriteToFile(string filePath)
    {
        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var pact = new JsonObject
        {
            ["consumer"] = new JsonObject { ["name"] = _consumer },
            ["provider"] = new JsonObject { ["name"] = _provider },
            ["interactions"] = new JsonArray(
                _interactions
                    .Select(i => (JsonNode)i.ToJsonObject())
                    .ToArray()),
            ["metadata"] = new JsonObject
            {
                ["pactSpecification"] = new JsonObject { ["version"] = "3.0.0" },
                ["generatedBy"]       = "VerticalSliceCrud.IntegrationTests.PactRecording",
            },
        };

        var json = pact.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(filePath, json);
    }

    /// <summary>Returns the path to the solution root by walking up from the test binary.</summary>
    public static string ResolvePactsDirectory()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !dir.GetFiles("*.slnx").Any() && !dir.GetFiles("*.sln").Any())
            dir = dir.Parent;

        return dir is not null
            ? Path.Combine(dir.FullName, "tests", "contract-tests", "pacts")
            : Path.Combine(AppContext.BaseDirectory, "pacts");
    }
}
