namespace Shared.Events;

public class JobCreatedEvent
{
    public Guid JobId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string JobName { get; set; } = string.Empty;
    public string GpuType { get; set; } = string.Empty;
    public int GpuCount { get; set; }
    public decimal DurationHours { get; set; }
    public decimal CostPerHour { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
