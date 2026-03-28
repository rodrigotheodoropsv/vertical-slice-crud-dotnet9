namespace VerticalSliceCrud.Api.Common.Errors;

/// <summary>Contrato de erro retornado pela API (RFC 7807).</summary>
public sealed record ApiError(string Type, string Title, int Status, string Detail);
