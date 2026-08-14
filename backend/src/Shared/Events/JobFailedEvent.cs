namespace Shared.Events;

public class JobFailedEvent
{
    public Guid JobId { get; set; }
    public Guid UserId { get; set; }
    public string NodeId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public double PartialDurationHours { get; set; }
    public DateTime FailedAt { get; set; } = DateTime.UtcNow;
}
