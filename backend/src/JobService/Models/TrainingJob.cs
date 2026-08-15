namespace JobService.Models;

public class TrainingJob
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GpuType { get; set; } = string.Empty;
    public int GpuCount { get; set; } = 1;
    public string Status { get; set; } = "CREATED"; // CREATED | QUEUED | RUNNING | COMPLETED | FAILED
    public int Progress { get; set; } = 0;
    public decimal? DurationHours { get; set; }
    public decimal CostPerHour { get; set; }
    public decimal TotalCost { get; set; }
    public string? AssignedNodeId { get; set; }
    public string? Command { get; set; }
    public string? Framework { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
