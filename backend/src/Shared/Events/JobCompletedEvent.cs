namespace Shared.Events;

public class JobCompletedEvent
{
    public Guid JobId { get; set; }
    public Guid UserId { get; set; }
    public string NodeId { get; set; } = string.Empty;
    public string GpuType { get; set; } = string.Empty;
    public double ActualDurationHours { get; set; }
    public decimal FinalCost { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
