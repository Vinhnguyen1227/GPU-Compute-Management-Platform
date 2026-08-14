namespace Shared.Events;

public class JobProgressEvent
{
    public Guid JobId { get; set; }
    public int ProgressPercent { get; set; }
    public string CurrentEpoch { get; set; } = string.Empty;
    public string LogSnippet { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
