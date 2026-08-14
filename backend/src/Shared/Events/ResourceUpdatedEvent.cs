namespace Shared.Events;

public class ResourceUpdatedEvent
{
    public string NodeId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal GpuUtilPercent { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
