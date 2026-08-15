namespace JobService.Models;

public record JobDto(
    Guid Id,
    string Name,
    Guid ProjectId,
    string ProjectName,
    string GpuType,
    int GpuCount,
    string Status,
    int Progress,
    decimal? DurationHours,
    decimal CostPerHour,
    decimal TotalCost,
    string? AssignedNodeId,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string Command,
    string Framework
);
