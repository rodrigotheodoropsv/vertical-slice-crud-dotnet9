using System.Text.Json.Nodes;

namespace VerticalSliceCrud.IntegrationTests.PactRecording;

/// <summary>
/// A <see cref="DelegatingHandler"/> that intercepts every HTTP call made by the
/// integration-test client and records the request/response pair as a Pact V3
/// interaction in the supplied <see cref="PactRecorder"/>.
///
/// Call <see cref="SetNext"/> immediately before each HTTP call you want to
/// capture to attach a human-readable description and a set of provider states.
/// Calls made without a prior <see cref="SetNext"/> can also be captured in
/// auto mode with generated description/provider-state metadata.
/// </summary>
internal sealed class PactRecordingHandler : DelegatingHandler
{
    private readonly PactRecorder _recorder;
    private readonly bool _autoRecordUnconfigured;
    private readonly string _defaultAutoProviderState;
    private string? _pendingDescription;
    private string[]? _pendingStates;
    private bool _suppressNextRecording;

    public PactRecordingHandler(
        PactRecorder recorder,
        bool autoRecordUnconfigured = false,
        string defaultAutoProviderState = "auto recorded state")
    {
        _recorder = recorder;
        _autoRecordUnconfigured = autoRecordUnconfigured;
        _defaultAutoProviderState = defaultAutoProviderState;
    }

    /// <summary>
    /// Sets the description and provider states for the <em>next</em> HTTP call.
    /// Must be called immediately before the call you wish to record.
    /// </summary>
    public void SetNext(string description, params string[] providerStates)
    {
        _pendingDescription = description;
        _pendingStates      = providerStates;
    }

    /// <summary>
    /// Skips recording for the next HTTP call. Useful for setup/fixture requests
    /// when auto recording is enabled.
    /// </summary>
    public void SuppressNextRecording()
    {
        _suppressNextRecording = true;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // Capture pending metadata before the async call resets it
        var description = _pendingDescription;
        var states      = _pendingStates ?? [];
        var suppressThisCall = _suppressNextRecording;
        _pendingDescription = null;
        _pendingStates      = null;
        _suppressNextRecording = false;

        // Buffer request content so we can read it here AND the inner handler can too
        string? reqBodyJson = null;
        if (request.Content is not null)
        {
            await request.Content.LoadIntoBufferAsync(cancellationToken);
            reqBodyJson = await request.Content.ReadAsStringAsync(cancellationToken);
        }

        var response = await base.SendAsync(request, cancellationToken);

        // Record if explicitly configured via SetNext, or via auto mode.
        if (!suppressThisCall)
        {
            if (description is null)
            {
                if (!_autoRecordUnconfigured)
                    return response;

                description = BuildAutoDescription(request, response);
                states = [_defaultAutoProviderState];
            }

            // Buffer response content so we can read it here AND the caller can too
            await response.Content.LoadIntoBufferAsync(cancellationToken);
            await RecordAsync(request, reqBodyJson, response, description, states);
        }

        return response;
    }

    private async Task RecordAsync(
        HttpRequestMessage req,
        string? reqBodyJson,
        HttpResponseMessage res,
        string description,
        string[] states)
    {
        // ── Request ───────────────────────────────────────────────────────────
        var reqHeaders = new Dictionary<string, string>();
        if (req.Content?.Headers.ContentType is { } ct)
            reqHeaders["Content-Type"] = ct.ToString();

        JsonNode? reqBody = null;
        if (!string.IsNullOrWhiteSpace(reqBodyJson))
            reqBody = JsonNode.Parse(reqBodyJson);

        var pactReq = new PactRequest(
            Method:  req.Method.Method,
            Path:    req.RequestUri?.AbsolutePath ?? "/",
            Headers: reqHeaders.Count > 0 ? reqHeaders : null,
            Body:    reqBody);

        // ── Response ──────────────────────────────────────────────────────────
        var resHeaders = new Dictionary<string, string>();
        if (res.Content.Headers.ContentType is { } rct)
            resHeaders["Content-Type"] = rct.ToString();

        JsonNode? resBody        = null;
        JsonObject? matchingRules = null;

        var resBodyJson = await res.Content.ReadAsStringAsync();
        if (!string.IsNullOrWhiteSpace(resBodyJson))
        {
            resBody = JsonNode.Parse(resBodyJson);

            var bodyRules = MatchingRuleBuilder.Build(resBody);
            if (bodyRules.Count > 0)
                matchingRules = new JsonObject { ["body"] = bodyRules };
        }

        var pactRes = new PactResponse(
            Status:        (int)res.StatusCode,
            Headers:       resHeaders.Count > 0 ? resHeaders : null,
            Body:          resBody,
            MatchingRules: matchingRules);

        _recorder.AddInteraction(new PactInteraction(
            Description:    description,
            ProviderStates: states,
            Request:        pactReq,
            Response:       pactRes));
    }

    private static string BuildAutoDescription(HttpRequestMessage req, HttpResponseMessage res)
    {
        var method = req.Method.Method;
        var path = req.RequestUri?.AbsolutePath ?? "/";
        return $"auto {method} {path} -> {(int)res.StatusCode}";
    }
}
